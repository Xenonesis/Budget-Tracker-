"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, ensureUserProfile, calculateNextRecurringDate } from "@/lib/utils";
import { Currency } from "@/components/ui/currency";
import { useUserPreferences } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Calendar, 
  Edit2, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  List,
  LayoutGrid,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { AddTransactionButton } from "@/components/ui/bottom-navigation";
import { FixedSizeList as VirtualizedList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import styles from './transactions.module.css';

interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category_id: string;
  category_name?: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  recurring_id?: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
}

interface RecurringTransaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category_id: string;
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";
  start_date: string;
  end_date?: string;
  last_generated?: string;
  created_at: string;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  user_id?: string;
  type: 'income' | 'expense' | 'both';
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface FormData {
  type: "income" | "expense";
  category_id: string;
  amount: string;
  description: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";
  recurring_end_date: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { currency, setCurrency, setUsername } = useUserPreferences();
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [upcomingRecurringTransactions, setUpcomingRecurringTransactions] = useState<{id: string, transactions: {date: string, amount: number, description: string}[]}[]>([]);
  const [showUpcomingPreview, setShowUpcomingPreview] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: "expense",
    category_id: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    is_recurring: false,
    recurring_frequency: "monthly",
    recurring_end_date: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: "",
    end: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState<{
    name: string;
    type: "income" | "expense" | "both";
  }>({
    name: "",
    type: "expense"
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [customCategoryError, setCustomCategoryError] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pullMoveY = useRef(0);
  const refreshDistance = 80; // Minimum distance to pull to trigger refresh
  const contentRef = useRef<HTMLDivElement>(null);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [frequentCategories, setFrequentCategories] = useState<Category[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    date: true,
    type: true,
    category: true,
    description: true,
    amount: true
  });
  const [scheduleExportFrequency, setScheduleExportFrequency] = useState<"none" | "weekly" | "monthly">("none");
  const [scheduleExportDay, setScheduleExportDay] = useState<number>(1);
  const [scheduleExportFormat, setScheduleExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  const exportToCSV = () => {
    // Get selected columns
    const selectedColumns = Object.entries(exportColumns)
      .filter(([_, selected]) => selected)
      .map(([column]) => column);
    
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }
    
    // Create headers based on selected columns
    const headers = selectedColumns.map(col => {
      switch(col) {
        case 'date': return 'Date';
        case 'type': return 'Type';
        case 'category': return 'Category';
        case 'description': return 'Description';
        case 'amount': return 'Amount';
        default: return '';
      }
    });
    
    // Create CSV content with selected columns
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => {
        const row: string[] = [];
        
        if (exportColumns.date) row.push(formatDate(t.date));
        if (exportColumns.type) row.push(t.type);
        if (exportColumns.category) row.push(t.category_name || 'Uncategorized');
        if (exportColumns.description) row.push(`"${t.description.replace(/"/g, '""')}"`); // Escape quotes
        if (exportColumns.amount) row.push(t.amount.toString());
        
        return row.join(',');
      })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    try {
      // Dynamic import to reduce bundle size
      const ExcelJS = await import('exceljs').then(mod => mod.default);
      
      // Get selected columns
      const selectedColumns = Object.entries(exportColumns)
        .filter(([_, selected]) => selected)
        .map(([column]) => column);
      
      if (selectedColumns.length === 0) {
        toast.error("Please select at least one column to export");
        return;
      }
      
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Transactions");
      
      // Define columns
      const columns = [];
      if (exportColumns.date) columns.push({ header: 'Date', key: 'date', width: 15 });
      if (exportColumns.type) columns.push({ header: 'Type', key: 'type', width: 10 });
      if (exportColumns.category) columns.push({ header: 'Category', key: 'category', width: 20 });
      if (exportColumns.description) columns.push({ header: 'Description', key: 'description', width: 30 });
      if (exportColumns.amount) columns.push({ header: 'Amount', key: 'amount', width: 15 });
      
      worksheet.columns = columns;
      
      // Add rows
      transactions.forEach(t => {
        const rowData: any = {};
        if (exportColumns.date) rowData.date = formatDate(t.date);
        if (exportColumns.type) rowData.type = t.type;
        if (exportColumns.category) rowData.category = t.category_name || 'Uncategorized';
        if (exportColumns.description) rowData.description = t.description;
        if (exportColumns.amount) rowData.amount = t.amount;
        
        worksheet.addRow(rowData);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Generate file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Excel file exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  // Uncomment and implement PDF export functionality
  const exportToPDF = async () => {
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Create document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Transactions Report", 14, 15);
      
      // Add date range if selected
      if (dateRange.start && dateRange.end) {
        doc.setFontSize(10);
        doc.text(`Date range: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, 14, 22);
      }
      
      // Add summary section
      doc.setFontSize(10);
      const summaryY = dateRange.start && dateRange.end ? 28 : 22;
      doc.text(`Total Income: ${formatCurrency(summary.totalIncome)}`, 14, summaryY);
      doc.text(`Total Expenses: ${formatCurrency(summary.totalExpense)}`, 14, summaryY + 5);
      doc.text(`Net Balance: ${formatCurrency(summary.balance)}`, 14, summaryY + 10);
      
      // Get selected columns for export
      const selectedColumns = Object.entries(exportColumns)
        .filter(([_, selected]) => selected)
        .map(([column]) => column);
      
      if (selectedColumns.length === 0) {
        toast.error("Please select at least one column to export");
        return;
      }
      
      // Define table columns based on selections
      const columns = [];
      if (exportColumns.date) columns.push('Date');
      if (exportColumns.type) columns.push('Type');
      if (exportColumns.category) columns.push('Category');
      if (exportColumns.description) columns.push('Description');
      if (exportColumns.amount) columns.push('Amount');
      
      // Prepare rows based on selected columns
      const rows = transactions.map(t => {
        const row = [];
        if (exportColumns.date) row.push(formatDate(t.date));
        if (exportColumns.type) row.push(t.type.charAt(0).toUpperCase() + t.type.slice(1));
        if (exportColumns.category) row.push(t.category_name || 'Uncategorized');
        if (exportColumns.description) row.push(t.description);
        if (exportColumns.amount) row.push(formatCurrency(t.amount));
        return row;
      });
      
      // Add table
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: summaryY + 15,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 20 }, // Type
          2: { cellWidth: 30 }, // Category
          3: { cellWidth: 'auto' }, // Description (flexible)
          4: { cellWidth: 25, halign: 'right' } // Amount (right-aligned)
        }
      });
      
      // Add footer with generation date
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save PDF
      doc.save(`transactions_${new Date().toISOString().slice(0,10)}.pdf`);
      
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const scheduleExport = () => {
    if (scheduleExportFrequency === 'none') {
      toast.error("Please select a frequency for scheduled exports");
      return;
    }
    
    // Get day of the week/month for scheduling
    const dayLabel = scheduleExportFrequency === 'weekly' 
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][scheduleExportDay]
      : `Day ${scheduleExportDay}`;
    
    // Save schedule settings to localStorage
    const scheduleConfig = {
      frequency: scheduleExportFrequency,
      day: scheduleExportDay,
      format: scheduleExportFormat,
      columns: exportColumns,
      nextRun: calculateNextExportDate(scheduleExportFrequency, scheduleExportDay).toISOString()
    };
    
    localStorage.setItem('exportSchedule', JSON.stringify(scheduleConfig));
    
    toast.success(`Export scheduled for ${scheduleExportFrequency}, ${dayLabel}`);
    setShowExportOptions(false);
  };

  const calculateNextExportDate = (frequency: 'weekly' | 'monthly', day: number): Date => {
    const now = new Date();
    const result = new Date(now);
    
    if (frequency === 'weekly') {
      // day is 0-6 (Sunday-Saturday)
      const currentDay = now.getDay(); // 0-6
      const daysToAdd = (day - currentDay + 7) % 7;
      result.setDate(now.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
    } else if (frequency === 'monthly') {
      // day is 1-31
      const currentMonth = now.getMonth();
      const targetDay = Math.min(day, new Date(now.getFullYear(), currentMonth + 1, 0).getDate());
      
      if (now.getDate() >= targetDay) {
        // Move to next month
        result.setMonth(currentMonth + 1);
      }
      
      result.setDate(targetDay);
    }
    
    return result;
  };

  const toggleExportOptions = () => {
    setShowExportOptions(!showExportOptions);
  };

  const handleExportColumnChange = (column: keyof typeof exportColumns) => {
    setExportColumns({
      ...exportColumns,
      [column]: !exportColumns[column]
    });
  };

  async function fetchTransactions() {
    try {
      setLoading(true);
      
      // Get user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Load user preferences
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      // If profile exists, update our preferences
      if (profileData) {
        if (profileData.currency) {
          setCurrency(profileData.currency);
        }
        
        if (profileData.username) {
          setUsername(profileData.username);
        }
      }
      
      // Log the fetch attempt
      console.log("Fetching transactions for user:", user.id);
      
      // Fetch initial transactions with pagination
      // Make sure we're not filtering by type unless explicitly requested
      let query = supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id);
      
      // Only filter by type if a specific filter is set
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
        console.log("Filtering transactions by type:", filterType);
      } else {
        console.log("Fetching all transaction types");
      }
      
      const { data, error }: ApiResponse<(Transaction & { categories: Category | null })[]> = await query
        .order('date', { ascending: false })
        .limit(itemsPerPage);

      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No transaction data received");
        throw new Error("No data received");
      }

      console.log(`Fetched ${data.length} transactions:`, data.map(t => ({ id: t.id, type: t.type, amount: t.amount })));

      const transactions = data.map(transaction => ({
        ...transaction,
        category_name: transaction.categories?.name || 'Uncategorized'
      }));

      setTransactions(transactions);
      setHasMore(data.length === itemsPerPage);
      calculateSummary(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  const calculateSummary = (transactionsData: Transaction[]) => {
    const summary = transactionsData.reduce((acc, transaction) => {
      if (transaction.type === "income") {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpense += transaction.amount;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0
    });
    
    summary.balance = summary.totalIncome - summary.totalExpense;
    setSummary(summary);
  };

  const fetchCategories = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error("No authenticated user found when fetching categories");
        return;
      }

      console.log("Fetching categories for user:", userData.user.id);
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${userData.user.id}`)
        .eq('is_active', true)
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
        return;
      }
      
      console.log("Fetched categories:", data?.length, "items");
      
      if (!data || data.length === 0) {
        console.log("No categories found, creating defaults");
        await createDefaultCategories(userData.user.id);
        return fetchCategories(); // Fetch again after creating defaults
      }
      
      setCategories(data || []);

      // Also update frequent categories based on transaction history
      loadFrequentCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const createDefaultCategories = async (userId: string) => {
    try {
      console.log("Creating default categories for user:", userId);
      
      // Expanded list of categories
      const defaultCategories = [
        // Expense categories
        { name: "Groceries", type: "expense", is_active: true, user_id: userId },
        { name: "Dining Out", type: "expense", is_active: true, user_id: userId },
        { name: "Transportation", type: "expense", is_active: true, user_id: userId },
        { name: "Utilities", type: "expense", is_active: true, user_id: userId },
        { name: "Housing", type: "expense", is_active: true, user_id: userId },
        { name: "Entertainment", type: "expense", is_active: true, user_id: userId },
        { name: "Healthcare", type: "expense", is_active: true, user_id: userId },
        { name: "Shopping", type: "expense", is_active: true, user_id: userId },
        { name: "Education", type: "expense", is_active: true, user_id: userId },
        { name: "Other Expense", type: "expense", is_active: true, user_id: userId },
        
        // Income categories
        { name: "Salary", type: "income", is_active: true, user_id: userId },
        { name: "Freelance", type: "income", is_active: true, user_id: userId },
        { name: "Investments", type: "income", is_active: true, user_id: userId },
        { name: "Gifts", type: "income", is_active: true, user_id: userId },
        { name: "Refunds", type: "income", is_active: true, user_id: userId },
        { name: "Other Income", type: "income", is_active: true, user_id: userId },
      ];

      console.log("Inserting default categories:", defaultCategories);
      
      // Try to insert one by one to ensure at least some succeed
      for (const category of defaultCategories) {
        const { error } = await supabase.from("categories").insert([category]);
        if (error) {
          console.error(`Error creating category ${category.name}:`, error);
        } else {
          console.log(`Category ${category.name} created successfully`);
        }
      }
    } catch (error) {
      console.error("Error creating default categories:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    loadFrequentCategories();
    loadDraftTransaction();
  }, []);

  // Debug categories
  useEffect(() => {
    console.log("All categories:", categories);
    console.log("Filtered categories for type:", formData.type, categories.filter(category => 
      category.type === formData.type || category.type === 'both'));
  }, [categories, formData.type]);

  const resetForm = () => {
    setFormData({
      type: "expense",
      category_id: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      is_recurring: false,
      recurring_frequency: "monthly",
      recurring_end_date: ""
    });
    setIsEditing(false);
    setEditId(null);
    setCustomCategoryError(false);
    setShowCustomCategoryForm(false);
    setNewCategory({
      name: "",
      type: "expense"
    });
  };

  // Generate suggestions based on previous transactions
  const generateSuggestions = (input: string) => {
    if (!input || input.length < 2) {
      setDescriptionSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Filter transactions to find similar descriptions
    const inputLower = input.toLowerCase();
    
    // Get unique descriptions from previous transactions that match the input
    const matchingDescriptions = transactions
      .filter(t => t.description && t.description.toLowerCase().includes(inputLower))
      .map(t => t.description)
      .filter((desc, index, self) => self.indexOf(desc) === index)
      .slice(0, 5); // Limit to 5 suggestions
    
    setDescriptionSuggestions(matchingDescriptions);
    setShowSuggestions(matchingDescriptions.length > 0);
  };
  
  // Modify the handleInputChange function to generate suggestions for description field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for category selection
    if (name === "category_id" && value === "custom") {
      setShowCustomCategoryForm(true);
      // Set newCategory type to match current transaction type
      setNewCategory(prev => ({
        ...prev,
        type: formData.type
      }));
    }

    // Special handling for transaction type changes
    if (name === "type") {
      // When transaction type changes, update newCategory type to match
      setNewCategory(prev => ({
        ...prev,
        type: value as "income" | "expense" | "both"
      }));
      
      console.log(`Transaction type changed to: ${value}, updating newCategory type`);
    }

    // Clear any custom category error when user changes selection
    if (name === "category_id" && customCategoryError) {
      setCustomCategoryError(false);
    }
    
    // Generate suggestions for description field
    if (name === "description") {
      generateSuggestions(value);
    }

    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    
    setFormData(updatedFormData);
    
    // Auto-save after a delay
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!isEditing) { // Only auto-save for new transactions
        saveDraftTransaction(updatedFormData);
      }
    }, 1000);
  };
  
  // Function to select a suggestion
  const selectSuggestion = (suggestion: string) => {
    setFormData(prev => ({ ...prev, description: suggestion }));
    setShowSuggestions(false);
  };

  const openTransactionForm = (isEdit = false, transaction: Transaction | null = null) => {
    if (isEdit && transaction) {
      setFormData({
        type: transaction.type,
        category_id: transaction.category_id,
        amount: transaction.amount.toString(),
        description: transaction.description,
        date: transaction.date,
        is_recurring: !!transaction.recurring_id,
        recurring_frequency: transaction.recurring_id ? "monthly" : "monthly",
        recurring_end_date: transaction.recurring_id ? "" : ""
      });
      setIsEditing(true);
      setEditId(transaction.id);
    } else {
      resetForm();
      setIsEditing(false);
      setEditId(null);
    }
    
    setShowForm(true);
    
    // Add a class to the html element to prevent scrolling on mobile
    if (window.innerWidth < 768) {
      document.documentElement.classList.add("form-drawer-open");
    }
  };
  
  const closeTransactionForm = () => {
    setShowForm(false);
    document.documentElement.classList.remove("form-drawer-open");
    resetForm();
    setIsEditing(false);
    setEditId(null);
    setEditingRecurring(null);
  };
  
  const handleEdit = (transaction: Transaction) => {
    openTransactionForm(true, transaction);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to add transactions");
        setFormLoading(false);
        return;
      }

      // Validate form data
      if (!formData.category_id || !formData.amount || !formData.date) {
        toast.error("Please fill in all required fields.");
        setFormLoading(false);
        return;
      }

      // If it's still "custom", that means they didn't click the "Add Category" button
      if (formData.category_id === "custom") {
        toast.error("Please create the custom category before saving the transaction.");
        setFormLoading(false);
        return;
      }

      const parsedAmount = parseFloat(formData.amount);
      
      // Ensure transaction type is validated
      if (formData.type !== 'income' && formData.type !== 'expense') {
        console.error("Invalid transaction type:", formData.type);
        toast.error("Invalid transaction type. Please select income or expense.");
        setFormLoading(false);
        return;
      }
      
      // Log the transaction data before submission for debugging
      console.log("Submitting transaction:", {
        type: formData.type,
        category_id: formData.category_id,
        amount: parsedAmount,
        description: formData.description || '',
        date: formData.date,
      });
      
      // Create a new transaction object - explicitly set type to ensure it matches expected values
      const newTransaction = {
        user_id: userData.user.id,
        type: formData.type === 'income' ? 'income' : 'expense',
        category_id: formData.category_id,
        amount: parsedAmount,
        description: formData.description || '',
        date: formData.date,
      };

      console.log("Final transaction to be saved:", newTransaction);

      if (formData.is_recurring) {
        if (editingRecurring) {
          // Update an existing recurring transaction
          const { error } = await supabase
            .from("recurring_transactions")
            .update({
              type: newTransaction.type,  // Use validated type
              category_id: formData.category_id,
              amount: parsedAmount,
              description: formData.description || '',
              start_date: formData.date,
              frequency: formData.recurring_frequency,
              end_date: formData.recurring_end_date || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingRecurring.id);

          if (error) {
            console.error("Error updating recurring transaction:", error);
            toast.error(`Failed to update recurring transaction: ${error.message}`);
            setFormLoading(false);
            return;
          }
          toast.success("Recurring transaction updated!");
          setEditingRecurring(null);
        } else {
          // Create a new recurring transaction
          const { data: recurringData, error: recurringError } = await supabase
            .from("recurring_transactions")
            .insert({
              user_id: userData.user.id,
              type: newTransaction.type,  // Use validated type
              category_id: formData.category_id,
              amount: parsedAmount,
              description: formData.description || '',
              frequency: formData.recurring_frequency,
              start_date: formData.date,
              end_date: formData.recurring_end_date || null,
              active: true
            })
            .select();
            
          if (recurringError) {
            console.error("Error creating recurring transaction:", recurringError);
            toast.error(`Failed to create recurring transaction: ${recurringError.message}`);
            setFormLoading(false);
            return;
          }
          
          // Create the first instance of the transaction
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              user_id: userData.user.id,
              type: newTransaction.type,  // Use validated type
              category_id: formData.category_id,
              amount: parsedAmount,
              description: formData.description || '',
              date: formData.date,
              recurring_id: recurringData[0].id
            });
            
          if (transactionError) {
            console.error("Error creating initial transaction:", transactionError);
            toast.error(`Failed to create initial transaction: ${transactionError.message}`);
            setFormLoading(false);
            return;
          }
          
          toast.success("Recurring transaction created");
        }
      } else {
        // Handle regular transaction (non-recurring)
        if (isEditing && editId) {
          // Update existing transaction
          const { error } = await supabase
            .from("transactions")
            .update({
              type: newTransaction.type,  // Use validated type
              category_id: formData.category_id,
              amount: parsedAmount,
              description: formData.description || '',
              date: formData.date
            })
            .eq("id", editId);

          if (error) {
            console.error("Error updating transaction:", error);
            toast.error(`Failed to update transaction: ${error.message}`);
            setFormLoading(false);
            return;
          }
          toast.success("Transaction updated!");
        } else {
          // Insert new transaction
          console.log("Inserting new transaction of type:", newTransaction.type);
          
          // Try with direct insert first
          const { data, error } = await supabase
            .from("transactions")
            .insert([{
              user_id: userData.user.id,
              type: newTransaction.type,  // Use validated type
              category_id: formData.category_id,
              amount: parsedAmount,
              description: formData.description || '',
              date: formData.date
            }])
            .select();

          if (error) {
            console.error("Error inserting transaction:", error);
            
            // If there was an error, try with a different approach for enum handling
            if (error.message.includes('type')) {
              console.log("Trying alternative approach for transaction type");
              
              const { data: altData, error: altError } = await supabase
                .from("transactions")
                .insert([{
                  user_id: userData.user.id,
                  // Try to use string literal to match enum exactly
                  type: newTransaction.type === 'income' ? 'income' : 'expense',
                  category_id: formData.category_id,
                  amount: parsedAmount,
                  description: formData.description || '',
                  date: formData.date
                }])
                .select();
                
              if (altError) {
                console.error("Alternative approach also failed:", altError);
                toast.error(`Failed to add transaction: ${altError.message}`);
                setFormLoading(false);
                return;
              }
              
              console.log("Transaction inserted successfully with alternative approach:", altData);
              toast.success(`${newTransaction.type === 'income' ? 'Income' : 'Expense'} transaction added!`);
            } else {
              toast.error(`Failed to add transaction: ${error.message}`);
              setFormLoading(false);
              return;
            }
          } else {
            console.log("Transaction inserted successfully:", data);
            toast.success(`${newTransaction.type === 'income' ? 'Income' : 'Expense'} transaction added!`);
          }
        }
      }

      // Clear form and refresh data
      closeTransactionForm();
      await fetchTransactions();
      
      // If sorting is active, reapply it
      if (sortField) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        setSortField(sortField);
        setSortDirection(sortDirection);
      }
    } catch (error: any) {
      console.error("Error in transaction submission:", error);
      toast.error(`An error occurred: ${error?.message || "Unknown error"}`);
    } finally {
      setFormLoading(false);
      // Clear draft after submission
      clearDraftTransaction();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);

      if (error) throw error;
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction");
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortTransactions = (transactions: Transaction[]) => {
    return [...transactions].sort((a, b) => {
      let compareA, compareB;
      
      if (sortField === 'date') {
        compareA = new Date(a.date).getTime();
        compareB = new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        compareA = a.amount;
        compareB = b.amount;
      } else if (sortField === 'category') {
        compareA = a.category_name?.toLowerCase() || '';
        compareB = b.category_name?.toLowerCase() || '';
      } else {
        compareA = a.description.toLowerCase();
        compareB = b.description.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
  };

  // Memoize the filtering of transactions to prevent recalculation on every render
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filterType !== "all" && transaction.type !== filterType) return false;

      if (
        searchTerm &&
        !transaction.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      if (dateRange.start && new Date(transaction.date) < new Date(dateRange.start))
        return false;
      if (dateRange.end && new Date(transaction.date) > new Date(dateRange.end))
        return false;

      return true;
    });
  }, [transactions, filterType, searchTerm, dateRange]);

  // Memoize the sorting of transactions to prevent recalculation on every render
  const sortedTransactions = useMemo(() => {
    return sortTransactions(filteredTransactions);
  }, [filteredTransactions, sortField, sortDirection]);
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Memoize the current page of transactions
  const currentTransactions = useMemo(() => {
    return sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedTransactions, indexOfFirstItem, indexOfLastItem]);
  
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Please enter a category name");
      return;
    }
    
    setIsSavingCategory(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("User session expired. Please login again.");
        return;
      }
      
      // Check if category already exists
      const { data: existingCategories } = await supabase
        .from("categories")
        .select("*")
        .ilike("name", newCategory.name.trim())
        .or(`user_id.is.null,user_id.eq.${userData.user.id}`);
        
      if (existingCategories && existingCategories.length > 0) {
        // Category exists, use it instead
        const existingCategory = existingCategories[0];
        setFormData(prev => ({
          ...prev,
          category_id: existingCategory.id
        }));
        setShowCustomCategoryForm(false);
        toast.info(`Using existing category "${existingCategory.name}"`);
        return;
      }
      
      // Create new category
      const { data: newCategoryData, error } = await supabase
        .from("categories")
        .insert([{
          name: newCategory.name.trim(),
          type: newCategory.type,
          is_active: true,
          user_id: userData.user.id
        }])
        .select()
        .single();
        
      if (error) {
        console.error("Error creating category:", error);
        alert(`Failed to create category: ${error.message}`);
        return;
      }
      
      // Update categories list
      await fetchCategories();
      
      // Update form with new category
      setFormData(prev => ({
        ...prev,
        category_id: newCategoryData.id
      }));
      
      toast.success(`Category "${newCategoryData.name}" created successfully`);
      setShowCustomCategoryForm(false);
    } catch (error) {
      console.error("Error creating custom category:", error);
      alert("Failed to create custom category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  useEffect(() => {
    // Auto-switch to card view on small screens
    const checkScreenSize = () => {
      if (window.innerWidth < 640 && viewMode === "table") {
        setViewMode("card");
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [viewMode]);

  // Pull to refresh implementation
  const onTouchStart = useCallback((e: TouchEvent) => {
    const { screenY } = e.touches[0];
    pullStartY.current = screenY;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!contentRef.current) return;
    
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY > 0) return;
    
    const { screenY } = e.touches[0];
    pullMoveY.current = screenY;
    
    const pullDistance = pullMoveY.current - pullStartY.current;
    
    if (pullDistance > 0) {
      // Prevent default behavior when pulling down
      e.preventDefault();
      
      // Create pull effect with CSS transform
      const pullFactor = Math.min(pullDistance * 0.3, refreshDistance);
      contentRef.current.style.transform = `translateY(${pullFactor}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!contentRef.current) return;
    
    const pullDistance = pullMoveY.current - pullStartY.current;
    
    // Reset transform
    contentRef.current.style.transform = 'translateY(0)';
    
    // Trigger refresh if pulled enough
    if (pullDistance > refreshDistance) {
      try {
        setRefreshing(true);
        await fetchTransactions();
        toast.success("Transactions refreshed");
      } catch (error) {
        toast.error("Failed to refresh transactions");
      } finally {
        setRefreshing(false);
      }
    }
  }, [fetchTransactions]);

  useEffect(() => {
    if (!contentRef.current) return;
    
    const content = contentRef.current;
    
    content.addEventListener('touchstart', onTouchStart, { passive: false });
    content.addEventListener('touchmove', onTouchMove, { passive: false });
    content.addEventListener('touchend', onTouchEnd);
    
    return () => {
      content.removeEventListener('touchstart', onTouchStart);
      content.removeEventListener('touchmove', onTouchMove);
      content.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);
  
  const loadMoreTransactions = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Fetch more transactions with pagination
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(transactions.length, transactions.length + itemsPerPage - 1);

      if (error) throw error;

      if (data.length > 0) {
        const newTransactions = data.map(transaction => ({
          ...transaction,
          category_name: transaction.categories?.name || 'Uncategorized'
        }));
        
        setTransactions(prev => [...prev, ...newTransactions]);
        setHasMore(data.length === itemsPerPage);
        calculateSummary([...transactions, ...newTransactions]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more transactions:", error);
      toast.error("Failed to load more transactions");
    } finally {
      setLoadingMore(false);
    }
  };

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || loading) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreTransactions();
        }
      },
      { threshold: 0.5 }
    );
    
    observerRef.current.observe(loadMoreRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, transactions]);

  // Improved skeleton loader component
  const TransactionSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="p-4 border-b animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
            <div className="h-4 bg-muted-foreground/20 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 bg-muted-foreground/20 rounded-full"></div>
            <div className="h-6 bg-muted-foreground/20 rounded-full w-32"></div>
          </div>
          <div className="h-4 bg-muted-foreground/20 rounded w-full max-w-xs mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-muted-foreground/20 rounded w-20"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted-foreground/20 rounded-md"></div>
              <div className="h-8 w-8 bg-muted-foreground/20 rounded-md"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  // Skeleton loader for the card view while loading more
  const LoadMoreSkeleton = () => (
    <div className="p-4 border-b animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-16"></div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 bg-muted-foreground/20 rounded-full"></div>
        <div className="h-6 bg-muted-foreground/20 rounded-full w-32"></div>
      </div>
      <div className="h-4 bg-muted-foreground/20 rounded w-full max-w-xs mb-3"></div>
    </div>
  );

  // Load frequent categories
  const loadFrequentCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get the most frequently used categories by this user
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, categories(id, name, type)')
        .eq('user_id', user.id)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Debug the structure of the data
      console.log("First item from transactions data:", data[0]);
      console.log("First item categories structure:", data[0]?.categories);
      
      // Count occurrences of each category
      const categoryCounts: Record<string, {count: number, category: Category}> = {};
      
      data.forEach(item => {
        if (item.categories) {
          const categoryId = item.category_id;
          console.log("Processing category:", item.categories);
          
          // Check if categories is an array or a single object
          const categoryData = Array.isArray(item.categories) ? item.categories[0] : item.categories;
          
          if (!categoryCounts[categoryId]) {
            categoryCounts[categoryId] = {
              count: 0,
              category: {
                id: categoryData.id,
                name: categoryData.name,
                type: categoryData.type as 'income' | 'expense' | 'both'
              }
            };
          }
          categoryCounts[categoryId].count++;
        }
      });
      
      // Sort by count and get top 5
      const sortedCategories = Object.values(categoryCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => item.category);
      
      setFrequentCategories(sortedCategories);
    } catch (error) {
      console.error("Error loading frequent categories:", error);
    }
  };

  // Load draft transaction from localStorage
  const loadDraftTransaction = () => {
    try {
      const savedDraft = localStorage.getItem('transactionDraft');
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        setHasSavedDraft(true);
      }
    } catch (error) {
      console.error("Error loading draft transaction:", error);
    }
  };
  
  // Save draft transaction to localStorage
  const saveDraftTransaction = (data: FormData) => {
    try {
      localStorage.setItem('transactionDraft', JSON.stringify(data));
      setHasSavedDraft(true);
    } catch (error) {
      console.error("Error saving draft transaction:", error);
    }
  };
  
  // Clear draft transaction
  const clearDraftTransaction = () => {
    try {
      localStorage.removeItem('transactionDraft');
      setHasSavedDraft(false);
    } catch (error) {
      console.error("Error clearing draft transaction:", error);
    }
  };

  // Add fetchRecurringTransactions function
  const fetchRecurringTransactions = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error }: ApiResponse<(RecurringTransaction & { categories: Category | null })[]> = await supabase
        .from("recurring_transactions")
        .select(`
          *,
          categories:category_id (
            name,
            type
          )
        `)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recurring transactions:", error);
        return;
      }
      
      if (!data) {
        console.error("No data received from recurring transactions query");
        return;
      }

      setRecurringTransactions(data || []);
      
      // Generate upcoming recurring transactions preview
      if (data && data.length > 0) {
        generateUpcomingTransactions(data);
      }
    } catch (error) {
      console.error("Error in fetchRecurringTransactions:", error);
    }
  };

  const generateUpcomingTransactions = (recurringList: RecurringTransaction[]) => {
    const upcoming: {id: string, transactions: {date: string, amount: number, description: string}[]}[] = [];
    
    recurringList.forEach(recurring => {
      if (!recurring.active) return;
      
      const transactions: {date: string, amount: number, description: string}[] = [];
      const today = new Date();
      let nextDate = new Date(recurring.last_generated || recurring.start_date);
      
      // Generate next 5 upcoming transactions
      for (let i = 0; i < 5; i++) {
        nextDate = calculateNextRecurringDate(nextDate, recurring.frequency);
        
        // Skip if end date is defined and we've passed it, or if date is in the past
        if (
          (recurring.end_date && new Date(nextDate) > new Date(recurring.end_date)) ||
          new Date(nextDate) < today
        ) {
          continue;
        }
        
        transactions.push({
          date: nextDate.toISOString().split('T')[0],
          amount: recurring.amount,
          description: recurring.description
        });
      }
      
      if (transactions.length > 0) {
        upcoming.push({
          id: recurring.id,
          transactions
        });
      }
    });
    
    setUpcomingRecurringTransactions(upcoming);
  };

  const toggleUpcomingPreview = () => {
    setShowUpcomingPreview(!showUpcomingPreview);
  };

  const openEditRecurringForm = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setFormData({
      type: recurring.type,
      category_id: recurring.category_id,
      amount: recurring.amount.toString(),
      description: recurring.description,
      date: recurring.start_date,
      is_recurring: true,
      recurring_frequency: recurring.frequency,
      recurring_end_date: recurring.end_date || ""
    });
    setShowForm(true);
  };

  // Process due recurring transactions
  const processRecurringTransactions = async (recurringList: RecurringTransaction[]) => {
    try {
      const today = new Date();
      const processedCount = {
        created: 0,
        skipped: 0
      };
      
      for (const recurring of recurringList) {
        // Skip inactive recurring transactions
        if (!recurring.active) continue;
        
        // Skip if end date is reached
        if (recurring.end_date && new Date(recurring.end_date) < today) continue;
        
        // Calculate next due date
        const lastGenerated = recurring.last_generated 
          ? new Date(recurring.last_generated) 
          : new Date(recurring.start_date);
        
        const nextDueDate = calculateNextRecurringDate(lastGenerated, recurring.frequency);
        
        // Skip if next due date is in the future
        if (nextDueDate > today) continue;
        
        // Create transaction for the due date
        const { error } = await supabase
          .from("transactions")
          .insert({
            user_id: recurring.user_id,
            type: recurring.type,
            category_id: recurring.category_id,
            amount: recurring.amount,
            description: `${recurring.description} (Recurring)`,
            date: nextDueDate.toISOString().split("T")[0],
            recurring_id: recurring.id
          });
          
        if (error) {
          console.error("Error creating recurring transaction:", error);
          processedCount.skipped++;
          continue;
        }
        
        // Update last_generated
        await supabase
          .from("recurring_transactions")
          .update({ last_generated: nextDueDate.toISOString() })
          .eq("id", recurring.id);
          
        processedCount.created++;
      }
      
      if (processedCount.created > 0) {
        toast.success(`Created ${processedCount.created} recurring transactions`);
        fetchTransactions(); // Refresh transactions
      }
      
      if (processedCount.skipped > 0) {
        toast.error(`Failed to process ${processedCount.skipped} recurring transactions`);
      }
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
    }
  };
  
  // Add useEffect to load recurring transactions
  useEffect(() => {
    if (!loading) {
      fetchRecurringTransactions();
    }
  }, [loading]);

  // Add a function to toggle between regular and recurring transactions
  const toggleRecurringView = () => {
    setShowRecurring(!showRecurring);
  };

  // Add recurring transaction management functions
  const deactivateRecurring = async (id: string) => {
    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ active: false })
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Recurring transaction deactivated");
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error deactivating recurring transaction:", error);
      toast.error("Failed to deactivate recurring transaction");
    }
  };

  // Add the handleAddCustomCategory function to handle adding custom categories
  const handleAddCustomCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    try {
      setIsSavingCategory(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("User not authenticated");
        return;
      }
      
      // Force category type to match transaction type to ensure consistency
      const categoryType = formData.type === 'income' ? 'income' : 'expense';
      
      console.log("Creating new category with FORCED type:", {
        name: newCategory.name.trim(),
        type: categoryType,
        transaction_type: formData.type,
        user_id: userData.user.id
      });
      
      // Create the new category with consistent typing
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategory.name.trim(),
          type: categoryType, // Use forced type based on transaction type
          user_id: userData.user.id,
          is_active: true
        })
        .select();
        
      if (error) {
        console.error("Error creating category:", error);
        toast.error(`Failed to create custom category: ${error.message}`);
        return;
      }
      
      // Make sure we have the data and the first item
      if (!data || data.length === 0) {
        toast.error("Failed to retrieve the created category");
        return;
      }
      
      const newCategoryData = data[0];
      console.log("Category created successfully:", newCategoryData);
      toast.success(`Category "${newCategoryData.name}" created successfully`);
      
      // Add the new category to the categories array so it appears in the dropdown immediately
      setCategories(prevCategories => [...prevCategories, newCategoryData]);
      
      // Select the newly created category
      setFormData(prevForm => ({ ...prevForm, category_id: newCategoryData.id }));
      setCustomCategoryError(false);
      
      // Reset new category form but keep the type aligned with current transaction type
      setNewCategory({
        name: "",
        type: formData.type === "income" ? "income" : "expense"
      });
      
      // Reset the custom category view
      setShowCustomCategoryForm(false);
      
      // Refresh categories
      await fetchCategories();
    } catch (error) {
      console.error("Error adding custom category:", error);
      toast.error("An error occurred while creating the category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Memoized virtualized renderers
  const TableRowRenderer = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const transaction = currentTransactions[index];
    if (!transaction) return null;
    
    return (
      <div className={styles.virtualizedRow} style={{...style, height: style.height, width: style.width, position: 'absolute', top: style.top, left: 0}}>
        <div className={styles.virtualizedCell}>
          <div className={styles.dateColumn}>{formatDate(transaction.date)}</div>
          <div className={styles.typeColumn}>
            <span
              className={`${styles.typeTag} ${
                transaction.type === "income"
                  ? styles.incomeTag
                  : styles.expenseTag
              }`}
            >
              {transaction.type}
            </span>
          </div>
          <div className={styles.categoryColumn}>
            {transaction.category_name || "Uncategorized"}
          </div>
          <div className={styles.descriptionColumn}>
            {transaction.description}
          </div>
          <div
            className={`${styles.amountColumn} ${
              transaction.type === "income" ? styles.incomeText : styles.expenseText
            }`}
          >
            <Currency value={transaction.amount} />
          </div>
          <div className="w-[10%] min-w-[100px] text-right space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(transaction)}
                    aria-label={`Edit transaction: ${transaction.description}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit transaction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon" 
                    onClick={() => handleDelete(transaction.id)}
                    aria-label={`Delete transaction: ${transaction.description}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete transaction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  }, [currentTransactions, handleEdit, handleDelete]);

  const CardRenderer = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const transaction = currentTransactions[index];
    if (!transaction) return null;
    
    return (
      <div style={style} className="px-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {formatDate(transaction.date)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                transaction.type === "income"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {transaction.type}
            </span>
          </div>
          
          <div className="mb-1">
            <div className="font-medium">{transaction.description}</div>
            <div className="text-sm text-muted-foreground">
              {transaction.category_name || "Uncategorized"}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div
              className={`text-lg font-bold ${
                transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              <Currency value={transaction.amount} />
            </div>
            
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(transaction)}
                      aria-label={`Edit transaction: ${transaction.description}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit transaction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon" 
                      onClick={() => handleDelete(transaction.id)}
                      aria-label={`Delete transaction: ${transaction.description}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete transaction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    );
  }, [currentTransactions, handleEdit, handleDelete]);

  if (loading && transactions.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="skeleton-loader h-8 w-40"></div>
          <div className="flex gap-2">
            <div className="skeleton-loader h-10 w-24 rounded-md"></div>
            <div className="skeleton-loader h-10 w-36 rounded-md"></div>
          </div>
        </div>
        
        {/* Skeleton Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="skeleton-loader h-4 w-24 mb-2"></div>
            <div className="skeleton-loader h-8 w-32"></div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="skeleton-loader h-4 w-24 mb-2"></div>
            <div className="skeleton-loader h-8 w-32"></div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm sm:col-span-2 md:col-span-1">
            <div className="skeleton-loader h-4 w-24 mb-2"></div>
            <div className="skeleton-loader h-8 w-32"></div>
          </div>
        </div>
        
        {/* Skeleton Filters */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
          <div className="skeleton-loader h-6 w-32 mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="skeleton-loader h-32 rounded-md"></div>
            <div className="skeleton-loader h-32 rounded-md"></div>
            <div className="skeleton-loader h-32 rounded-md sm:col-span-2 md:col-span-1"></div>
          </div>
        </div>
        
        {/* Skeleton Transaction List */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-4 sm:hidden">
            <TransactionSkeleton />
          </div>
          <div className="hidden sm:block">
            <div className="border-b p-3 bg-muted/50">
              <div className="flex justify-between">
                <div className="skeleton-loader h-6 w-20"></div>
                <div className="skeleton-loader h-6 w-20"></div>
                <div className="skeleton-loader h-6 w-20"></div>
                <div className="skeleton-loader h-6 w-20"></div>
                <div className="skeleton-loader h-6 w-20"></div>
              </div>
            </div>
            
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="border-b p-3 flex justify-between items-center">
                <div className="skeleton-loader h-5 w-24"></div>
                <div className="skeleton-loader h-6 w-32 rounded-full"></div>
                <div className="skeleton-loader h-5 w-40"></div>
                <div className="skeleton-loader h-5 w-20"></div>
                <div className="flex gap-2">
                  <div className="skeleton-loader h-8 w-8 rounded-md"></div>
                  <div className="skeleton-loader h-8 w-8 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div ref={contentRef}>
        {/* Pull-to-refresh indicator */}
        {refreshing && (
          <div className="pull-indicator">
            <svg className="pull-indicator-icon animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold md:text-3xl">Transactions</h1>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </DropdownMenuItem>
                {scheduleExportFrequency !== 'none' && (
                  <DropdownMenuItem onClick={scheduleExport}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Export
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={() => openTransactionForm()}
              className="flex items-center gap-1 min-h-[44px]"
            >
              <PlusCircle size={16} />
              <span>Add Transaction</span>
            </Button>
          </div>
        </div>

        {/* Floating action button for mobile */}
        <AddTransactionButton onClick={() => openTransactionForm()} />

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-sm font-medium text-muted-foreground">Total Income</h2>
            <p className="mt-1 text-2xl font-bold text-green-500">
              <Currency value={summary.totalIncome} />
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-sm font-medium text-muted-foreground">Total Expenses</h2>
            <p className="mt-1 text-2xl font-bold text-destructive">
              <Currency value={summary.totalExpense} />
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:col-span-2 md:col-span-1">
            <h2 className="text-sm font-medium text-muted-foreground">Net Balance</h2>
            <p
              className={`mt-1 text-2xl font-bold ${
                summary.balance >= 0 ? "text-green-500" : "text-destructive"
              }`}
            >
              <Currency value={summary.balance} />
            </p>
          </div>
        </div>

        {/* Add tab buttons for regular and recurring transactions */}
        <div className="mb-4 flex gap-2">
          <Button 
            variant={showRecurring ? "outline" : "default"} 
            size="sm" 
            onClick={() => setShowRecurring(false)}
          >
            Regular
          </Button>
          <Button 
            variant={showRecurring ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowRecurring(true)}
          >
            <RefreshCw size={16} className={`${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
        
        {/* Conditionally show regular or recurring transactions */}
        {!showRecurring ? (
          /* Regular transactions view - existing JSX */
          <div>
            {/* ... Your existing transactions table/card display ... */}
          </div>
        ) : (
          /* Recurring transactions view */
          <div>
            <Collapsible>
              <div className="mb-6 rounded-lg border bg-card shadow-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-4 border-b flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <RefreshCw size={16} className="mr-2 text-muted-foreground" />
                      <h3 className="font-medium">Recurring Transactions</h3>
                    </div>
                    <ChevronDown size={16} className="transition-transform" />
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-4">
                    {recurringTransactions.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No recurring transactions found</p>
                        <Button
                          className="mt-4"
                          onClick={() => {
                            setFormData({...formData, is_recurring: true});
                            openTransactionForm();
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Recurring Transaction
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => processRecurringTransactions(recurringTransactions)}
                          >
                            <RefreshCw size={16} className={`${refreshing ? "animate-spin" : ""}`} />
                            <span className="ml-2">Refresh</span>
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Description</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Amount</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Frequency</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Start Date</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">End Date</th>
                                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recurringTransactions.map((recurringTx) => (
                                <tr key={recurringTx.id} className="border-b">
                                  <td className="whitespace-nowrap px-4 py-3">
                                    <div className="font-medium">{recurringTx.description}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {recurringTx.type === "income" ? "Income" : "Expense"}
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    <span className={recurringTx.type === "income" ? "text-green-600" : "text-red-600"}>
                                      {formatCurrency(recurringTx.amount)}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    {recurringTx.frequency.charAt(0).toUpperCase() + recurringTx.frequency.slice(1)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">{formatDate(recurringTx.start_date)}</td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    {recurringTx.end_date ? formatDate(recurringTx.end_date) : "No end date"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deactivateRecurring(recurringTx.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            
            <Button
              className="mb-4"
              onClick={() => toggleUpcomingPreview()}
              aria-expanded={showUpcomingPreview}
              aria-controls="upcoming-preview"
            >
              {showUpcomingPreview ? 'Hide' : 'Show'} Upcoming Transactions
            </Button>
            
            {showUpcomingPreview && (
              <div id="upcoming-preview" className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-lg font-medium">Upcoming Transactions</h3>
                {/* Upcoming transactions content */}
              </div>
            )}
          </div>
        )}

        {/* Transaction Form Drawer */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="max-h-[90vh] w-[90vw] max-w-md overflow-y-auto rounded-lg border bg-card p-6 shadow-lg md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {isEditing ? "Edit Transaction" : "Add Transaction"}
                  {hasSavedDraft && !isEditing && (
                    <span className="ml-2 text-xs text-muted-foreground">(Draft saved)</span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={closeTransactionForm}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                  aria-label="Close form"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form Content */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="transaction-type" className="mb-2 block text-sm font-medium">
                      Type
                    </label>
                    <select
                      id="transaction-type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      disabled={formLoading}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary high-contrast-dropdown"
                      required
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="transaction-amount" className="mb-2 block text-sm font-medium">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        id="transaction-amount"
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleInputChange}
                        disabled={formLoading}
                        className="w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-sm text-muted-foreground">{currency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="category_id" className="mb-2 block text-sm font-medium">
                    Category
                  </label>
                  
                  {formData.category_id === "custom" ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="New category name"
                        className="w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-sm font-medium"
                      />
                      <div className="flex space-x-2">
                        {/* Hidden type dropdown - type is automatically determined by transaction type */}
                        <input 
                          type="hidden" 
                          value={formData.type === "income" ? "income" : "expense"} 
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddCustomCategory}
                          disabled={isSavingCategory || !newCategory.name.trim()}
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSavingCategory ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current mr-2"></div>
                              Saving {formData.type === "income" ? "Income" : "Expense"} Category...
                            </>
                          ) : (
                            `Add ${formData.type === "income" ? "Income" : "Expense"} Category`
                          )}
                        </Button>
                      </div>
                      {customCategoryError && (
                        <p className="text-sm text-red-500">
                          Please create a category or select an existing one
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {frequentCategories && frequentCategories.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium mb-2">Frequently used:</p>
                          <div className="flex flex-wrap gap-2">
                            {frequentCategories
                              .filter(cat => cat.type === formData.type || cat.type === 'both')
                              .map((category) => (
                                <Button
                                  key={category.id}
                                  type="button"
                                  size="sm"
                                  variant={formData.category_id === category.id ? "default" : "outline"}
                                  className="rounded-full text-xs px-3 py-1 h-auto"
                                  onClick={() => {
                                    setFormData({ ...formData, category_id: category.id });
                                    setCustomCategoryError(false);
                                  }}
                                >
                                  {category.name}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      <select
                        id="category_id"
                        value={formData.category_id}
                        onChange={(e) => {
                          setFormData({ ...formData, category_id: e.target.value });
                          setCustomCategoryError(false);
                        }}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary high-contrast-dropdown"
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        {categories
                          .filter(cat => cat.type === formData.type || cat.type === 'both')
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))
                        }
                        <option value="custom">+ Create new category</option>
                      </select>
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="transaction-description" className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <input
                    id="transaction-description"
                    name="description"
                    placeholder="Enter description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="transaction-date" className="mb-2 block text-sm font-medium">
                    Date
                  </label>
                  <input
                    id="transaction-date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={formLoading}
                    className="w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    required
                  />
                </div>

                {/* Add recurring transaction toggle */}
                {!isEditing && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="is_recurring" className="text-sm font-medium">
                      This is a recurring transaction
                    </label>
                  </div>
                )}
                
                {/* Show recurring options if recurring is checked */}
                {formData.is_recurring && (
                  <div className="space-y-4 rounded-lg border bg-background p-4">
                    <div>
                      <label htmlFor="recurring_frequency" className="mb-2 block text-sm font-medium">
                        Frequency
                      </label>
                      <select
                        id="recurring_frequency"
                        value={formData.recurring_frequency}
                        onChange={(e) => setFormData({ ...formData, recurring_frequency: e.target.value as any })}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary high-contrast-dropdown"
                        required
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="recurring_end_date" className="mb-2 block text-sm font-medium">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="recurring_end_date"
                        value={formData.recurring_end_date}
                        onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave blank for indefinite recurring transactions
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeTransactionForm}
                    className="px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="px-4"
                  >
                    {formLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                        {isEditing ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>{isEditing ? "Update" : "Save"}</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateRange({ start: today, end: today });
            }}
            className="h-9"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              setDateRange({
                start: startOfWeek.toISOString().split('T')[0],
                end: today.toISOString().split('T')[0]
              });
            }}
            className="h-9"
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              setDateRange({
                start: startOfMonth.toISOString().split('T')[0],
                end: today.toISOString().split('T')[0]
              });
            }}
            className="h-9"
          >
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateRange({ start: "", end: "" });
              setSearchTerm("");
              setFilterType("all");
            }}
            className="h-9 ml-auto"
          >
            Clear Filters
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-card shadow-sm overflow-hidden">
          <Collapsible>
            <div className="p-4 border-b flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="p-2 -ml-2 flex items-center gap-2"
                  aria-label="Toggle filters visibility"
                >
                  <Filter size={16} />
                  <span>Filters</span>
                  <ChevronDown size={16} className="transition-transform" />
                </Button>
              </CollapsibleTrigger>
              
              <div className="flex items-center gap-3">
                <div className="flex border rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={viewMode === "table" ? "default" : "ghost"} 
                          size="sm" 
                          onClick={() => setViewMode("table")}
                          className="rounded-r-none h-9 px-3"
                          aria-label="Table view"
                        >
                          <List size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Table view</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={viewMode === "card" ? "default" : "ghost"} 
                          size="sm" 
                          onClick={() => setViewMode("card")}
                          className="rounded-l-none h-9 px-3"
                          aria-label="Card view"
                        >
                          <LayoutGrid size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Card view</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <CollapsibleContent>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label htmlFor="filter-type" className="mb-2 block text-sm font-medium">Type</label>
                    <select
                      id="filter-type"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5"
                      aria-label="Filter by transaction type"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="search-term" className="mb-2 block text-sm font-medium">Search</label>
                    <div className="relative">
                      <input
                        id="search-term"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2.5 pr-10"
                        placeholder="Search transactions..."
                        aria-label="Search transactions"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Search size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="date-range" className="mb-2 block text-sm font-medium">Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, start: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        aria-label="Start date"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, end: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        aria-label="End date"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Transactions List */}
        <div className="rounded-lg border bg-card shadow-sm">
          {/* Table View */}
          {viewMode === "table" && (
            <>
              {loading ? (
                <TransactionSkeleton />
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different search term or add your first transaction.
                  </p>
                  <Button
                    onClick={() => openTransactionForm()}
                    className="mt-4 min-h-[44px]"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium cursor-pointer"
                            onClick={() => handleSort('date')}
                          >
                            <div className="flex items-center">
                              Date
                              {sortField === 'date' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium cursor-pointer"
                            onClick={() => handleSort('category')}
                          >
                            <div className="flex items-center">
                              Category
                              {sortField === 'category' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium cursor-pointer"
                            onClick={() => handleSort('description')}
                          >
                            <div className="flex items-center">
                              Description
                              {sortField === 'description' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-right text-sm font-medium cursor-pointer"
                            onClick={() => handleSort('amount')}
                          >
                            <div className="flex items-center justify-end">
                              Amount
                              {sortField === 'amount' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTransactions.map(transaction => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">{formatDate(transaction.date)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  transaction.type === "income"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {transaction.category_name || "Uncategorized"}
                            </td>
                            <td className="px-4 py-3 text-sm max-w-[250px] truncate">
                              {transaction.description}
                            </td>
                            <td
                              className={`px-4 py-3 text-right text-sm font-medium ${
                                transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              <Currency value={transaction.amount} />
                            </td>
                            <td className="px-4 py-3 text-right space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(transaction)}
                                      aria-label={`Edit transaction: ${transaction.description}`}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit transaction</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon" 
                                      onClick={() => handleDelete(transaction.id)}
                                      aria-label={`Delete transaction: ${transaction.description}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete transaction</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* Mobile Card View */}
          {viewMode === "card" && (
            <>
              {loading ? (
                <TransactionSkeleton />
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different search term or add your first transaction.
                  </p>
                  <Button
                    onClick={() => openTransactionForm()}
                    className="mt-4 min-h-[44px]"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>
              ) : (
                <div style={{ height: '75vh', width: '100%' }}>
                  <AutoSizer>
                    {({ height, width }) => (
                      <VirtualizedList
                        height={height}
                        itemCount={currentTransactions.length}
                        itemSize={120}
                        width={width}
                      >
                        {CardRenderer}
                      </VirtualizedList>
                    )}
                  </AutoSizer>
                </div>
              )}
            </>
          )}
          
          {/* Pagination - Enhanced for touch */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t p-4 gap-3">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-10 w-10 p-0 touch-target"
                >
                  <ChevronLeft size={20} />
                </Button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  // Display limited page buttons with ellipsis for large number of pages
                  if (
                    totalPages <= 5 ||
                    index === 0 ||
                    index === totalPages - 1 ||
                    (index >= currentPage - 2 && index <= currentPage)
                  ) {
                    return (
                      <Button
                        key={index}
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(index + 1)}
                        className="h-10 w-10 p-0 touch-target"
                      >
                        {index + 1}
                      </Button>
                    );
                  } else if (
                    (index === 1 && currentPage > 3) ||
                    (index === totalPages - 2 && currentPage < totalPages - 2)
                  ) {
                    return <span key={index} className="flex items-center px-2">...</span>;
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 p-0 touch-target"
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
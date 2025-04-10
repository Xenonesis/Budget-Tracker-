"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  PieChart as PieChartIcon,
  BarChart2, 
  ArrowRightLeft,
  Plus,
  AlertCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { supabase } from "@/lib/supabase";
import { getRandomColor } from "@/lib/colors";
import { useUserPreferences } from "@/lib/store";
import { Currency } from "@/components/ui/currency";

// Custom styles for enhanced chart interactions
const styles = {
  chartCard: "rounded-xl border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden",
  chartTitle: "text-base sm:text-lg font-semibold text-foreground",
  tooltipStyles: { 
    backgroundColor: 'var(--card)', 
    borderColor: 'var(--border)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid var(--border)',
    fontSize: '1rem',
    fontWeight: '500'
  },
  tooltipItemStyles: { 
    color: 'var(--foreground)', 
    padding: '0.25rem 0',
    fontSize: '0.95rem'
  },
  tooltipLabelStyles: { 
    color: 'var(--foreground)', 
    fontWeight: 'bold', 
    marginBottom: '0.5rem',
    fontSize: '1rem'
  },
  fadeUp: "animate-in fade-in-50 slide-in-from-bottom-5",
  hoverCard: "hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300",
  cardDecoration: "after:absolute after:top-0 after:right-0 after:h-24 after:w-24 after:bg-gradient-to-br after:from-primary/10 after:to-transparent after:rounded-bl-full after:-z-10 after:opacity-50",
  emptyState: "flex flex-col items-center justify-center p-6 text-center space-y-3",
  emptyStateIcon: "h-12 w-12 text-muted-foreground/40",
  emptyStateText: "text-sm text-muted-foreground",
  badge: "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
  badgePrimary: "bg-primary/10 text-primary",
  glassCard: "backdrop-blur-sm bg-card/80 border-muted/30",
  statBadge: "flex items-center justify-center h-6 px-2 rounded-full text-xs font-medium",
  positiveStatBadge: "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400",
  negativeStatBadge: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  neutralStatBadge: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  // Add gradient overlay to cards
  cardGradientOverlay: "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-50 before:rounded-xl before:-z-10",
  // Card headers with subtle gradient
  cardHeader: "bg-gradient-to-r from-muted/50 to-transparent p-4 rounded-t-xl border-b",
  customScroll: "scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20",
  shimmer: "animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent bg-[length:400%_100%]",
};

// Sample data for the charts
const monthlyData = [
  { name: "Jan", income: 3800, expense: 2200, balance: 1600, month: "2025-01" },
  { name: "Feb", income: 3900, expense: 2300, balance: 1600, month: "2025-02" },
  { name: "Mar", income: 4000, expense: 2400, balance: 1600, month: "2025-03" },
  { name: "Apr", income: 4100, expense: 2500, balance: 1600, month: "2025-04" },
  { name: "May", income: 4200, expense: 2600, balance: 1600, month: "2025-05" },
  { name: "Jun", income: 4300, expense: 2700, balance: 1600, month: "2025-06" },
  { name: "Jul", income: 4400, expense: 2800, balance: 1600, month: "2025-07" },
  { name: "Aug", income: 4500, expense: 2900, balance: 1600, month: "2025-08" },
  { name: "Sep", income: 4600, expense: 3000, balance: 1600, month: "2025-09" },
  { name: "Oct", income: 4700, expense: 3100, balance: 1600, month: "2025-10" },
  { name: "Nov", income: 4800, expense: 3200, balance: 1600, month: "2025-11" },
  { name: "Dec", income: 4900, expense: 3300, balance: 1600, month: "2025-12" }
];

const sampleExpenseData = [
  { name: "Housing", value: 1200, color: "#FF6384" },
  { name: "Food", value: 800, color: "#36A2EB" },
  { name: "Transportation", value: 400, color: "#FFCE56" },
  { name: "Entertainment", value: 300, color: "#4BC0C0" },
  { name: "Shopping", value: 250, color: "#9966FF" }
];

const sampleIncomeData = [
  { name: "Salary", value: 3500, color: "#FF6384" },
  { name: "Freelance", value: 800, color: "#36A2EB" },
  { name: "Investments", value: 400, color: "#FFCE56" }
];

const sampleTransactions = [
  { id: "1", description: "Grocery Shopping", date: "2025-06-15", category_name: "Food", amount: 85.20, type: "expense" },
  { id: "2", description: "Salary", date: "2025-06-01", category_name: "Income", amount: 3500, type: "income" },
  { id: "3", description: "Restaurant", date: "2025-06-10", category_name: "Food", amount: 45.80, type: "expense" },
  { id: "4", description: "Utilities", date: "2025-06-05", category_name: "Bills", amount: 120.50, type: "expense" },
  { id: "5", description: "Freelance Work", date: "2025-06-20", category_name: "Income", amount: 800, type: "income" },
  { id: "6", description: "Rent", date: "2025-05-01", category_name: "Housing", amount: 1200, type: "expense" },
  { id: "7", description: "Salary", date: "2025-05-01", category_name: "Income", amount: 3500, type: "income" },
  { id: "8", description: "Gas", date: "2025-05-10", category_name: "Transportation", amount: 65.30, type: "expense" },
  { id: "9", description: "Movie", date: "2025-04-15", category_name: "Entertainment", amount: 25.00, type: "expense" },
  { id: "10", description: "Bonus", date: "2025-04-01", category_name: "Income", amount: 500, type: "income" },
  { id: "11", description: "Rent", date: "2025-04-01", category_name: "Housing", amount: 1200, type: "expense" },
  { id: "12", description: "Shopping", date: "2025-03-20", category_name: "Shopping", amount: 150.75, type: "expense" }
];

// Helper function to format currency values
const formatCurrency = (value: number) => {
  // Get currency from user preferences via localStorage
  let currencyCode = 'USD';
  if (typeof window !== 'undefined') {
    currencyCode = localStorage.getItem('budget-currency') || 'USD';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to filter data by time period
const filterDataByTimeframe = <T extends { date: string }>(data: T[], timeframe: string): T[] => {
  const today = new Date();
  let startDate = new Date();
  
  switch(timeframe) {
    case "1m":
      startDate.setMonth(today.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(today.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(today.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    case "all":
      return data;
    default:
      startDate.setMonth(today.getMonth() - 6); // Default to 6 months
  }
  
  return data.filter(item => new Date(item.date) >= startDate);
};

// Data interface
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category_id: string;
  category_name?: string;
  description: string;
  date: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("6m");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const userPreferences = useUserPreferences();

  // Function to fetch transactions from the database
  const fetchTransactions = async () => {
    try {
      setIsDataLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("User not authenticated");
        setIsDataLoading(false);
        return;
      }
      
      // Fetch transactions with their categories
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });
        
      if (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transaction data");
        setIsDataLoading(false);
        return;
      }
      
      // Transform the data to match our Transaction interface
      const transformedData = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        amount: item.amount,
        type: item.type,
        category_id: item.category_id,
        category_name: item.categories?.name || "Uncategorized",
        description: item.description,
        date: item.date,
        created_at: item.created_at
      }));
      
      setAllTransactions(transformedData);
      // Initial filtering based on selected timeframe
      const filteredData = filterDataByTimeframe(transformedData, selectedTimeframe);
      setTransactions(filteredData);
      
      // Process data to generate charts
      processData(filteredData);
      
      setIsDataLoading(false);
    } catch (err) {
      console.error("Error in fetchTransactions:", err);
      setError("An unexpected error occurred");
      setIsDataLoading(false);
    }
  };
  
  // Process transaction data for charts and insights
  const processData = (filteredTransactions: Transaction[]) => {
    // Calculate expense data by category
    const expensesByCategory: Record<string, any> = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        // Use a fallback value if category_name is undefined
        const categoryName = t.category_name || "Uncategorized";
        
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = {
            name: categoryName,
            value: 0,
            color: getRandomColor(categoryName)
          };
        }
        expensesByCategory[categoryName].value += t.amount;
      }
    });
    
    const calculatedExpenseData = Object.values(expensesByCategory);
    setExpenseData(calculatedExpenseData);
    
    // Calculate income data by category
    const incomeByCategory: Record<string, any> = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        // Use a fallback value if category_name is undefined
        const categoryName = t.category_name || "Uncategorized";
        
        if (!incomeByCategory[categoryName]) {
          incomeByCategory[categoryName] = {
            name: categoryName,
            value: 0,
            color: getRandomColor(categoryName)
          };
        }
        incomeByCategory[categoryName].value += t.amount;
      }
    });
    
    const calculatedIncomeData = Object.values(incomeByCategory);
    setIncomeData(calculatedIncomeData);
    
    // Generate monthly data for trends
    const monthlyDataMap = new Map();
    
    // Initialize with last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toISOString().substring(0, 7); // YYYY-MM format
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      monthlyDataMap.set(monthYear, {
        name: monthName,
        month: monthYear,
        income: 0,
        expense: 0,
        balance: 0
      });
    }
    
    // Fill in data from transactions
    filteredTransactions.forEach(t => {
      const monthYear = t.date.substring(0, 7); // YYYY-MM format
      
      if (monthlyDataMap.has(monthYear)) {
        const monthData = monthlyDataMap.get(monthYear);
        
        if (t.type === 'income') {
          monthData.income += t.amount;
        } else {
          monthData.expense += t.amount;
        }
        
        monthData.balance = monthData.income - monthData.expense;
        monthlyDataMap.set(monthYear, monthData);
      }
    });
    
    // Convert map to array and sort by month
    const monthlyTrendsArray = Array.from(monthlyDataMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));
    
    setMonthlyData(monthlyTrendsArray);
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle timeframe changes
  useEffect(() => {
    if (allTransactions.length > 0) {
      const filteredData = filterDataByTimeframe(allTransactions, selectedTimeframe);
      setTransactions(filteredData);
      processData(filteredData);
    }
  }, [selectedTimeframe, allTransactions]);

  // Add a useEffect to handle loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Add effect to update UI when currency changes
  useEffect(() => {
    // Force a re-render when currency changes
    if (!isDataLoading) {
      // This will trigger a refresh of all currency displays
      setMonthlyData([...monthlyData]);
      setExpenseData([...expenseData]);
      setIncomeData([...incomeData]);
    }
  }, [userPreferences.currency, isDataLoading]);

  // Calculate total income, expenses, and categories
  const totalIncome = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0);
  const totalExpenses = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const categoryCount = Array.from(new Set(transactions.map(t => t.category_name || "Uncategorized"))).length;
  
  // Calculate percentage change month-over-month
  const calculateMonthlyChange = () => {
    if (monthlyData.length < 2) return { income: 0, expense: 0 };
    
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    const incomeChange = previousMonth.income > 0 
      ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 
      : 0;
      
    const expenseChange = previousMonth.expense > 0 
      ? ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100 
      : 0;
      
    return { income: incomeChange, expense: expenseChange };
  };
  
  const monthlyChange = calculateMonthlyChange();

  if (isPageLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Enhanced Page Header with Dashboard Information */}
      <header className={`mb-6 sm:mb-8 ${styles.fadeUp}`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden group">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-500">Analytics Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Visualize your financial health and track spending patterns
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <div className="h-8 px-3 rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm text-xs font-medium flex items-center">
                <span className="text-primary mr-2">📊</span>
                <span>{transactions.length} transactions</span>
              </div>
              <div className="h-8 px-3 rounded-lg border bg-primary/5 text-primary text-xs font-medium flex items-center">
                <span className="mr-2">🗓️</span>
                <span>
                  {selectedTimeframe === "1m" ? "Last Month" : 
                  selectedTimeframe === "3m" ? "Last 3 Months" : 
                  selectedTimeframe === "6m" ? "Last 6 Months" : 
                  selectedTimeframe === "1y" ? "Last Year" : "All Time"}
                </span>
              </div>
              <div className="h-8 px-3 rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm text-xs font-medium flex items-center">
                <span className="text-green-500 mr-2">💰</span>
                <span>Net: <Currency value={netBalance} /></span>
              </div>
            </div>
          </div>
          
          {!isDataLoading && transactions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`rounded-lg border ${styles.glassCard} p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">Total Income</p>
                    <p className="font-semibold text-green-600 dark:text-green-300">
                      <Currency value={totalIncome} />
                    </p>
                  </div>
                </div>
                {monthlyChange.income !== 0 && (
                  <div className={`${styles.statBadge} ${monthlyChange.income >= 0 ? styles.positiveStatBadge : styles.negativeStatBadge}`}>
                    {monthlyChange.income >= 0 ? "+" : ""}{monthlyChange.income.toFixed(1)}% MoM
                  </div>
                )}
              </div>
              
              <div className={`rounded-lg border ${styles.glassCard} p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <TrendingUp size={18} className="rotate-180" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">Total Expenses</p>
                    <p className="font-semibold text-red-600 dark:text-red-300">
                      <Currency value={totalExpenses} />
                    </p>
                  </div>
                </div>
                {monthlyChange.expense !== 0 && (
                  <div className={`${styles.statBadge} ${monthlyChange.expense <= 0 ? styles.positiveStatBadge : styles.negativeStatBadge}`}>
                    {monthlyChange.expense >= 0 ? "+" : ""}{monthlyChange.expense.toFixed(1)}% MoM
                  </div>
                )}
              </div>
              
              <div className={`rounded-lg border ${styles.glassCard} p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <PieChartIcon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">Categories</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="font-semibold dark:text-foreground">{categoryCount}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">active</p>
                    </div>
                  </div>
                </div>
                <div className={`${styles.statBadge} ${styles.neutralStatBadge}`}>
                  Analytics
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Error message if needed */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-400">Error Loading Data</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button 
              className="mt-2" 
              size="sm" 
              variant="outline" 
              onClick={() => fetchTransactions()}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      {/* Loading state overlay */}
      {isDataLoading && (
        <div className="mb-6 rounded-lg border bg-card p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading transaction data...</p>
        </div>
      )}

      {!isDataLoading && (
        <>
          {/* Enhanced Mobile-Friendly Time Period Filter */}
          <div className={`mb-6 ${styles.fadeUp}`} style={{ animationDelay: '50ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-medium">Time Period</h2>
              <div className="text-xs text-muted-foreground">
                Select a time range to analyze your financial data
              </div>
            </div>
            <div className="overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex items-center space-x-2 rounded-xl bg-muted/50 p-1 min-w-max border">
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === "1m" 
                      ? "bg-card shadow-sm text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSelectedTimeframe("1m")}
                >
                  1 Month
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === "3m" 
                      ? "bg-card shadow-sm text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSelectedTimeframe("3m")}
                >
                  3 Months
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === "6m" 
                      ? "bg-card shadow-sm text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSelectedTimeframe("6m")}
                >
                  6 Months
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === "1y" 
                      ? "bg-card shadow-sm text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSelectedTimeframe("1y")}
                >
                  1 Year
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === "all" 
                      ? "bg-card shadow-sm text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSelectedTimeframe("all")}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className={`${styles.emptyState} ${styles.fadeUp}`} style={{ animationDelay: '100ms' }}>
              <Activity className={styles.emptyStateIcon} />
              <div>
                <h3 className="font-medium mb-1">No transaction data available</h3>
                <p className={styles.emptyStateText}>
                  {allTransactions.length > 0 
                    ? `No transactions found in the selected time period (${
                        selectedTimeframe === "1m" ? "Last Month" : 
                        selectedTimeframe === "3m" ? "Last 3 Months" : 
                        selectedTimeframe === "6m" ? "Last 6 Months" : 
                        selectedTimeframe === "1y" ? "Last Year" : "All Time"
                      }).`
                    : "Add some transactions to see your financial insights."}
                </p>
                <Button 
                  className="mt-3"
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard/transactions/new'}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Improved Summary Cards Grid */}
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Transactions Card */}
                <div className={`rounded-xl border bg-card p-3 sm:p-4 shadow-sm ${styles.hoverCard}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary to-violet-400 text-white shadow-md">
                      <Activity size={16} className="sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Transactions</div>
                      <p className="text-lg sm:text-2xl font-bold mt-0.5">{transactions.length}</p>
                    </div>
                  </div>
                </div>
                
                {/* Total Income Card */}
                <div className={`rounded-xl border bg-card p-3 sm:p-4 shadow-sm ${styles.hoverCard}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-md">
                      <TrendingUp size={16} className="sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Income</div>
                      <p className="text-lg sm:text-2xl font-bold mt-0.5 text-green-600">
                        <Currency value={totalIncome} />
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Total Expenses Card */}
                <div className={`rounded-xl border bg-card p-3 sm:p-4 shadow-sm ${styles.hoverCard}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md">
                      <TrendingUp size={16} className="rotate-180 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Expenses</div>
                      <p className="text-lg sm:text-2xl font-bold mt-0.5 text-red-600">
                        <Currency value={totalExpenses} />
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Categories Card */}
                <div className={`rounded-xl border bg-card p-3 sm:p-4 shadow-sm ${styles.hoverCard}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
                      <PieChartIcon size={16} className="sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Categories</div>
                      <p className="text-lg sm:text-2xl font-bold mt-0.5">
                        {categoryCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improved Mobile-Friendly Tabs */}
              <Tabs defaultValue="trends" className="mb-6">
                <TabsList className="mb-4 sm:mb-6 bg-muted/50 p-1.5 rounded-xl overflow-x-auto whitespace-nowrap w-auto max-w-full border">
                  <TabsTrigger 
                    value="trends" 
                    className="rounded-lg text-xs sm:text-sm py-1.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/20"
                  >
                    <BarChart2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories" 
                    className="rounded-lg text-xs sm:text-sm py-1.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/20"
                  >
                    <PieChartIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-lg text-xs sm:text-sm py-1.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/20"
                  >
                    <Activity className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Overview
                  </TabsTrigger>
                </TabsList>
                
                {/* Trends Tab */}
                <TabsContent value="trends" className="space-y-5 animate-in fade-in">
                  {/* Financial Snapshot */}
                  <div className={`${styles.chartCard} ${styles.cardGradientOverlay} ${styles.hoverCard}`}>
                    <div className={`${styles.cardHeader}`}>
                      <h2 className={styles.chartTitle}>Financial Snapshot</h2>
                      <p className="text-sm text-foreground/80 mt-1 font-medium">
                        Monthly income vs. expenses for the selected period
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-4 mb-5 justify-center sm:justify-end">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-foreground">Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          <span className="text-sm font-medium text-foreground">Expenses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium text-foreground">Net Balance</span>
                        </div>
                      </div>
                      
                      <div className="h-[280px] sm:h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthlyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            barGap={0}
                            barCategoryGap="20%"
                          >
                            <defs>
                              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                              </linearGradient>
                              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                              </linearGradient>
                              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.7} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                              tick={{ fill: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}
                              tickLine={{ stroke: 'var(--border)' }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                              tick={{ fill: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}
                              tickLine={{ stroke: 'var(--border)' }}
                              dx={-5}
                              tickFormatter={(value) => {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                return value;
                              }}
                            />
                            <Tooltip 
                              formatter={(value) => {
                                const formattedValue = typeof window !== 'undefined' ? 
                                  formatCurrency(Number(value)) :
                                  `$${Number(value).toLocaleString()}`;
                                return [formattedValue, ""];
                              }}
                              contentStyle={{
                                ...styles.tooltipStyles,
                                color: 'var(--foreground)',
                                fontWeight: 500
                              }}
                              itemStyle={{
                                ...styles.tooltipItemStyles,
                                color: 'var(--foreground)',
                              }}
                              labelStyle={{
                                ...styles.tooltipLabelStyles,
                                color: 'var(--foreground)',
                                fontSize: '1rem'
                              }}
                              cursor={{ fill: 'var(--muted)', opacity: 0.2, radius: 4 }}
                            />
                            <Legend 
                              verticalAlign="top"
                              height={36}
                              iconSize={12}
                              iconType="circle"
                              formatter={(value) => (
                                <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 'bold' }}>{value}</span>
                              )}
                            />
                            <Bar 
                              dataKey="income" 
                              name="Income" 
                              fill="url(#incomeGradient)" 
                              radius={[4, 4, 0, 0]}
                              animationDuration={1500}
                            />
                            <Bar 
                              dataKey="expense" 
                              name="Expense" 
                              fill="url(#expenseGradient)" 
                              radius={[4, 4, 0, 0]}
                              animationDuration={1500}
                              animationBegin={300}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="balance" 
                              name="Balance"
                              stroke="#3b82f6" 
                              strokeWidth={3} 
                              dot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                              activeDot={{ r: 7, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                              animationDuration={2000}
                              animationBegin={600}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Income vs Expense Trend */}
                  <div className={`${styles.chartCard} ${styles.cardGradientOverlay} ${styles.hoverCard}`}>
                    <div className={`${styles.cardHeader}`}>
                      <h2 className={styles.chartTitle}>Income vs Expense Trend</h2>
                      <p className="text-sm text-foreground/80 mt-1 font-medium">
                        Visualize your income and expense patterns over time
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <div className="h-[220px] sm:h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={monthlyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="expenseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={{ stroke: 'var(--border)' }}
                              tick={{ fill: 'var(--muted-foreground)' }}
                              tickLine={{ stroke: 'var(--border)' }}
                              fontSize={12}
                            />
                            <YAxis 
                              axisLine={{ stroke: 'var(--border)' }}
                              tick={{ fill: 'var(--muted-foreground)' }}
                              tickLine={{ stroke: 'var(--border)' }}
                              fontSize={12}
                              tickFormatter={(value) => {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                return value;
                              }}
                            />
                            <Tooltip 
                              formatter={(value) => {
                                const formattedValue = typeof window !== 'undefined' ? 
                                  formatCurrency(Number(value)) :
                                  `$${Number(value).toLocaleString()}`;
                                return [formattedValue, ""];
                              }}
                              contentStyle={styles.tooltipStyles}
                              itemStyle={styles.tooltipItemStyles}
                              labelStyle={styles.tooltipLabelStyles}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="income" 
                              name="Income" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              fill="url(#incomeAreaGradient)" 
                              animationDuration={1500}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="expense" 
                              name="Expense" 
                              stroke="#ef4444" 
                              strokeWidth={2}
                              fill="url(#expenseAreaGradient)" 
                              animationDuration={1500}
                              animationBegin={300}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Expense Breakdown by Category */}
                    <div className={`${styles.chartCard} ${styles.cardGradientOverlay} ${styles.hoverCard}`}>
                      <div className={`${styles.cardHeader}`}>
                        <h2 className={styles.chartTitle}>Expense Breakdown</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          How your expenses are distributed across categories
                        </p>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex flex-col space-y-4">
                          <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  {expenseData.map((entry, index) => (
                                    <linearGradient key={`gradient-${index}`} id={`expenseGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                                    </linearGradient>
                                  ))}
                                </defs>
                                <Pie
                                  data={expenseData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={100}
                                  innerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                  paddingAngle={2}
                                  animationDuration={1500}
                                  label={(entry) => {
                                    if (entry && typeof entry.percent === 'number' && entry.percent > 0.05 && entry.name) {
                                      return `${entry.name} ${(entry.percent * 100).toFixed(0)}%`;
                                    }
                                    return '';
                                  }}
                                >
                                  {expenseData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={`url(#expenseGradient-${index})`} 
                                      stroke={entry.color}
                                      strokeWidth={1}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value) => {
                                    const formattedValue = typeof window !== 'undefined' ? 
                                      formatCurrency(Number(value)) :
                                      `$${Number(value).toLocaleString()}`;
                                    return [formattedValue, "Amount"];
                                  }}
                                  contentStyle={styles.tooltipStyles}
                                  itemStyle={styles.tooltipItemStyles}
                                  labelStyle={styles.tooltipLabelStyles}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 justify-center">
                            {expenseData.map((category, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
                                style={{ borderColor: category.color + '50', backgroundColor: category.color + '15' }}
                              >
                                <div 
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: category.color }}
                                ></div>
                                <span className="text-foreground">{category.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Details */}
                    <div className={`${styles.chartCard} ${styles.cardGradientOverlay} ${styles.hoverCard}`}>
                      <div className={`${styles.cardHeader}`}>
                        <h2 className={styles.chartTitle}>Category Details</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          Detailed breakdown of spending by category
                        </p>
                      </div>
                      
                      <div className="p-4">
                        <div className={`overflow-auto max-h-[350px] rounded-lg border ${styles.customScroll}`}>
                          <table className="w-full">
                            <thead className="border-b sticky top-0 bg-card z-10">
                              <tr>
                                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Category</th>
                                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Amount</th>
                                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {expenseData.length > 0 ? (
                                expenseData.map((category, index) => {
                                  const totalExpense = expenseData.reduce((sum, cat) => sum + cat.value, 0);
                                  const percentage = totalExpense > 0 ? (category.value / totalExpense) * 100 : 0;
                                  
                                  return (
                                    <tr key={index} className="hover:bg-muted/30 transition-colors text-sm">
                                      <td className="py-3 px-4">
                                        <div className="flex items-center">
                                          <span 
                                            className="mr-2 h-3 w-3 rounded-full flex-shrink-0" 
                                            style={{ backgroundColor: category.color }}
                                          ></span>
                                          <span className="truncate max-w-[150px] text-sm" title={category.name}>
                                            {category.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-right font-medium text-sm">
                                        <Currency value={category.value} />
                                      </td>
                                      <td className="py-3 px-4 text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                                          <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full rounded-full" 
                                              style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: category.color
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                                    No expense data for this time period
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Income Categories */}
                  <div className={`${styles.chartCard} ${styles.cardGradientOverlay} ${styles.hoverCard}`}>
                    <div className={`${styles.cardHeader}`}>
                      <h2 className={styles.chartTitle}>Income Sources</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Breakdown of your income streams
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <defs>
                                {incomeData.map((entry, index) => (
                                  <linearGradient key={`gradient-inc-${index}`} id={`incomeGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                                  </linearGradient>
                                ))}
                              </defs>
                              <Pie
                                data={incomeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={90}
                                innerRadius={50}
                                fill="#8884d8"
                                dataKey="value"
                                paddingAngle={2}
                                animationDuration={1500}
                                label={(entry) => {
                                  if (entry && typeof entry.percent === 'number' && entry.percent > 0.05 && entry.name) {
                                    return `${entry.name} ${(entry.percent * 100).toFixed(0)}%`;
                                  }
                                  return '';
                                }}
                              >
                                {incomeData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-inc-${index}`} 
                                    fill={`url(#incomeGradient-${index})`}
                                    stroke={entry.color}
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => {
                                  const formattedValue = typeof window !== 'undefined' ? 
                                    formatCurrency(Number(value)) :
                                    `$${Number(value).toLocaleString()}`;
                                  return [formattedValue, "Amount"];
                                }}
                                contentStyle={styles.tooltipStyles}
                                itemStyle={styles.tooltipItemStyles}
                                labelStyle={styles.tooltipLabelStyles}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="flex flex-col justify-center">
                          {incomeData.length > 0 ? (
                            <div className="space-y-4">
                              {incomeData.map((category, index) => {
                                const totalIncome = incomeData.reduce((sum, cat) => sum + cat.value, 0);
                                const percentage = totalIncome > 0 ? (category.value / totalIncome) * 100 : 0;
                                
                                return (
                                  <div key={index} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center">
                                        <span 
                                          className="mr-2 h-3 w-3 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: category.color }}
                                        ></span>
                                        <span className="text-foreground">{category.name}</span>
                                      </div>
                                      <span className="font-medium text-foreground"><Currency value={category.value} /></span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                      <div 
                                        className="h-full rounded-full" 
                                        style={{ 
                                          width: `${percentage}%`,
                                          backgroundColor: category.color
                                        }}
                                      ></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}% of total</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              No income data for this time period
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-5 animate-in fade-in">
                  {/* Financial Insights Overview */}
                  <div className={`${styles.chartCard} ${styles.cardGradientOverlay} ${styles.hoverCard}`}>
                    <div className={`${styles.cardHeader}`}>
                      <h2 className={styles.chartTitle}>Financial Snapshot</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Overall financial health
                        </span>
                        <span className={`${styles.badge} ${styles.badgePrimary}`}>
                          Key Metrics
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-5">
                      {/* Insights Grid - Enhanced for mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Income vs Expense Card */}
                        <div className="rounded-lg border bg-card/60 p-4 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">Income vs Expense</h3>
                            <ArrowRightLeft size={16} className="text-muted-foreground" />
                          </div>
                          
                          <div className="flex flex-col space-y-3.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">Total Income</span>
                              </div>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                <Currency value={totalIncome} />
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                <span className="text-sm">Total Expense</span>
                              </div>
                              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                <Currency value={totalExpenses} />
                              </span>
                            </div>
                            
                            <div className="h-px bg-border my-1"></div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                                <span className="text-sm">Net Balance</span>
                              </div>
                              <span className="text-sm font-medium text-primary">
                                <Currency value={netBalance} />
                              </span>
                            </div>
                            
                            {/* Add a progress indicator to show savings rate */}
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-muted-foreground">Savings Rate</span>
                                <span className={`${totalIncome > 0 ? 
                                  netBalance >= 0 ? 
                                    styles.positiveStatBadge : 
                                    styles.negativeStatBadge : 
                                  styles.neutralStatBadge}`}>
                                  {totalIncome > 0 ? 
                                    ((netBalance / totalIncome) * 100).toFixed(1) + '%' : 
                                    '0.0%'}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                                  style={{ width: `${totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Top Spending Categories Card */}
                        <div className="rounded-lg border bg-card/60 p-4 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">Top Spending Categories</h3>
                            <PieChartIcon size={16} className="text-muted-foreground" />
                          </div>
                          
                          <div className="space-y-3">
                            {expenseData.slice(0, 3).map((category, index) => {
                              const totalExpense = expenseData.reduce((sum, cat) => sum + cat.value, 0);
                              const percentage = totalExpense > 0 ? (category.value / totalExpense) * 100 : 0;
                              
                              return (
                                <div key={index} className="flex flex-col">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center">
                                      <span 
                                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                                        style={{ backgroundColor: category.color }}
                                      ></span>
                                      <span className="text-sm truncate max-w-[140px] sm:max-w-[180px]">
                                        {category.name}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium whitespace-nowrap">
                                      <Currency value={category.value} />
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full" 
                                      style={{ 
                                        width: `${percentage}%`,
                                        backgroundColor: category.color,
                                        transition: 'width 1s ease-in-out'
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-right text-muted-foreground mt-0.5">{percentage.toFixed(1)}% of total</p>
                                </div>
                              );
                            })}
                            {expenseData.length === 0 && (
                              <div className="text-center py-6 text-muted-foreground text-sm">
                                No expense data for this time period
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Transactions */}
                      <div className="rounded-lg border overflow-hidden">
                        <div className={`p-4 border-b bg-muted/10 flex items-center justify-between`}>
                          <h3 className="text-sm font-medium">Recent Transactions</h3>
                          <div className="flex items-center gap-2">
                            <span className={`${styles.badge} bg-muted`}>
                              {transactions.length} total
                            </span>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.location.href = '/dashboard/transactions'}>
                              View All
                            </Button>
                          </div>
                        </div>
                        
                        <div className={`overflow-auto max-h-[350px] ${styles.customScroll}`}>
                          <table className="w-full">
                            <thead className="bg-muted/5 sticky top-0 z-10">
                              <tr>
                                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Description</th>
                                <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
                                <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                                <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {transactions.slice(0, 10).map((transaction, index) => (
                                <tr key={index} className="hover:bg-muted/10 transition-colors text-sm">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-2.5 h-2.5 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                      <span className="truncate max-w-[140px] sm:max-w-[180px]">{transaction.description}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    {new Date(transaction.date).toLocaleDateString(undefined, { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/60 border max-w-[140px] truncate">
                                      {transaction.category_name}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                                    <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                      {transaction.type === 'income' ? '+' : '-'}<Currency value={transaction.amount} />
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {transactions.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                                    No transactions found for this time period
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, getUserTimezone } from "@/lib/utils";
import { useUserPreferences } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  X,
  RefreshCw,
  Trash,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import {
  validateAmount,
  validateDate,
  validateDescription,
  validateCategory,
  validateTransactionType,
  validateForm
} from "@/lib/validation";

interface Category {
  id: string;
  name: string;
  icon?: string;
  user_id?: string;
  type: 'income' | 'expense' | 'both';
}

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

interface AddTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  categories: Category[];
  isEditing?: boolean;
  editTransaction?: Transaction | null;
}

export default function AddTransactionForm({
  isOpen,
  onClose,
  onTransactionAdded,
  categories,
  isEditing = false,
  editTransaction = null
}: AddTransactionFormProps) {
  const { currency } = useUserPreferences();
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: "expense",
    category_id: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: "monthly",
    recurring_end_date: ""
  });
  
  const [customCategoryError, setCustomCategoryError] = useState(false);
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState<{
    name: string;
    type: "income" | "expense" | "both";
  }>({
    name: "",
    type: "expense"
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  
  // Load transaction data if editing
  useEffect(() => {
    if (isEditing && editTransaction) {
      // Format the date properly for the input element
      let formattedDate = editTransaction.date;
      try {
        // Try to parse and reformat the date to ensure YYYY-MM-DD format
        const dateObj = new Date(editTransaction.date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }

      setFormData({
        type: editTransaction.type,
        category_id: editTransaction.category_id,
        amount: editTransaction.amount.toString(),
        description: editTransaction.description,
        date: formattedDate, // Use the properly formatted date
        is_recurring: !!editTransaction.recurring_id,
        recurring_frequency: editTransaction.recurring_id ? "monthly" : "monthly",
        recurring_end_date: editTransaction.recurring_id ? "" : ""
      });
      
      // Ensure newCategory type is synced with transaction type
      setNewCategory(prev => ({
        ...prev,
        type: editTransaction.type
      }));
    } else {
      // Set default expense category if available
      const defaultCategory = categories
        .filter(cat => cat.type === 'expense' || cat.type === 'both')
        .sort((a, b) => a.name.localeCompare(b.name))
        [0]?.id || "";
        
      setFormData(prev => ({
        ...prev,
        category_id: defaultCategory
      }));
    }
  }, [isEditing, editTransaction, categories]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for category selection
    if (name === "category_id" && value === "custom") {
      console.log("Custom category selected, showing custom category form");
      setShowCustomCategoryForm(true);
      // Set newCategory type to match current transaction type
      const categoryType = formData.type === "income" ? "income" : "expense";
      setNewCategory(prev => ({
        ...prev,
        name: "",
        type: categoryType
      }));
    } else if (name === "category_id" && value !== "custom") {
      // Clear custom category form if not selecting custom
      setShowCustomCategoryForm(false);
    }

    // Special handling for transaction type changes
    if (name === "type") {
      // When transaction type changes, update newCategory type to match
      setNewCategory(prev => ({
        ...prev,
        type: value as "income" | "expense" | "both"
      }));
      
      console.log(`Transaction type changed to: ${value}, updating newCategory type`);
      
      // Reset category selection when transaction type changes to ensure compatibility
      const defaultCategory = categories
        .filter(cat => cat.type === value || cat.type === 'both')
        .sort((a, b) => a.name.localeCompare(b.name))
        [0]?.id || "";
        
      // Update form data with new default category based on type
      setFormData(prev => ({
        ...prev,
        [name]: value as 'income' | 'expense',
        category_id: defaultCategory
      }));
      
      // We already set the form data above, so return early
      return;
    }

    // Clear any custom category error when user changes selection
    if (name === "category_id" && customCategoryError) {
      setCustomCategoryError(false);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Add custom category
  const handleAddCustomCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        toast.error("Please enter a category name");
        return;
      }

      setIsSavingCategory(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to create categories");
        return;
      }
      
      // Check if the category already exists for this user
      const { data: existingCategories, error: checkError } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("name", newCategory.name.trim())
        .eq("user_id", userData.user.id);
        
      if (checkError) {
        console.error("Error checking existing categories:", checkError);
      }
      
      if (existingCategories && existingCategories.length > 0) {
        // Use the existing category instead of creating a new one
        const existingCategory = existingCategories[0];
        
        // Check if the existing category type matches the current transaction type
        const currentCategoryType = formData.type === 'income' ? 'income' : 'expense';
        
        // If the category exists but with a different type, update it to "both"
        if (existingCategory.type !== currentCategoryType && existingCategory.type !== 'both') {
          console.log("Updating category type to 'both'");
          const { error: updateError } = await supabase
            .from("categories")
            .update({ type: 'both' })
            .eq("id", existingCategory.id);
            
          if (updateError) {
            console.error("Error updating category type:", updateError);
          }
          
          existingCategory.type = 'both';
        }
        
        setFormData(prevForm => ({ ...prevForm, category_id: existingCategory.id }));
        setCustomCategoryError(false);
        setShowCustomCategoryForm(false);
        toast.success(`Using existing category: ${existingCategory.name}`);
        setIsSavingCategory(false);
        return;
      }
      
      // Force category type to match transaction type to ensure consistency
      const categoryType = formData.type === 'income' ? 'income' : 'expense';
      
      // Create the new category with correct typing
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategory.name.trim(),
          type: categoryType, // Use type based on transaction type
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
        console.error("No data returned after category creation");
        toast.error("Failed to retrieve the created category");
        return;
      }
      
      const newCategoryData = data[0];
      toast.success(`Category "${newCategoryData.name}" created successfully`);
      
      // Select the newly created category
      setFormData(prevForm => ({
        ...prevForm,
        category_id: newCategoryData.id
      }));
      
      setCustomCategoryError(false);
      
      // Reset new category form but keep the type aligned with current transaction type
      setNewCategory({
        name: "",
        type: formData.type === "income" ? "income" : "expense"
      });
      
      // Reset the custom category view
      setShowCustomCategoryForm(false);
      
      // Notify parent component to refresh categories
      onTransactionAdded();
    } catch (error) {
      console.error("Error adding custom category:", error);
      toast.error("An error occurred while creating the category");
    } finally {
      setIsSavingCategory(false);
    }
  };
  
  // Delete category
  const handleDeleteCategory = async (category: Category) => {
    try {
      setCategoryToDelete(category);
      setShowDeleteCategoryConfirm(true);
    } catch (error) {
      console.error("Error preparing to delete category:", error);
      toast.error("Failed to prepare category deletion");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsDeletingCategory(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to delete categories");
        return;
      }
      
      // First check if category is in use
      const { data: transactionsUsingCategory, error: checkError } = await supabase
        .from("transactions")
        .select("id")
        .eq("category_id", categoryToDelete.id)
        .eq("user_id", userData.user.id)
        .limit(1);
        
      if (checkError) {
        console.error("Error checking if category is in use:", checkError);
      }
      
      if (transactionsUsingCategory && transactionsUsingCategory.length > 0) {
        toast.error("Cannot delete category that is in use by transactions");
        setShowDeleteCategoryConfirm(false);
        setCategoryToDelete(null);
        return;
      }
      
      // Instead of actually deleting, mark as inactive
      const { error } = await supabase
        .from("categories")
        .update({ is_active: false })
        .eq("id", categoryToDelete.id)
        .eq("user_id", userData.user.id);
        
      if (error) {
        console.error("Error deleting category:", error);
        toast.error(`Failed to delete category: ${error.message}`);
        return;
      }
      
      toast.success(`Category "${categoryToDelete.name}" deleted successfully`);
      
      // If the deleted category was selected in the form, reset it
      if (formData.category_id === categoryToDelete.id) {
        setFormData(prevForm => ({
          ...prevForm,
          category_id: ""
        }));
      }
      
      // Notify parent component to refresh categories
      onTransactionAdded();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("An error occurred while deleting the category");
    } finally {
      setIsDeletingCategory(false);
      setShowDeleteCategoryConfirm(false);
      setCategoryToDelete(null);
    }
  };

  // Handle form submission
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

      // Perform comprehensive form validation
      const validations = [
        validateTransactionType(formData.type),
        validateCategory(formData.category_id),
        validateAmount(formData.amount),
        validateDate(formData.date),
        validateDescription(formData.description, false, 500)
      ];

      const validationResult = validateForm(validations);
      if (!validationResult.isValid) {
        toast.error(validationResult.message || "Please correct the errors in the form.");
        setFormLoading(false);
        return;
      }

      // If it's still "custom", that means they didn't click the "Add Category" button
      if (formData.category_id === "custom") {
        toast.error("Please create the custom category before saving the transaction.");
        setCustomCategoryError(true);
        setFormLoading(false);
        return;
      }

      // Additional check to ensure category_id is a valid UUID
      if (formData.category_id && !formData.category_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error("Invalid category_id format:", formData.category_id);
        toast.error("Invalid category selection. Please choose or create a valid category.");
        setCustomCategoryError(true);
        setFormLoading(false);
        return;
      }

      // Ensure amount is a valid number and not zero
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount greater than zero");
        setFormLoading(false);
        return;
      }

      // Parse and validate the date
      let formattedDate;
      try {
        // Make sure date is in YYYY-MM-DD format for Supabase
        const dateObj = new Date(formData.date);
        if (isNaN(dateObj.getTime())) {
          throw new Error("Invalid date");
        }
        
        // Format as YYYY-MM-DD to match database constraint
        formattedDate = dateObj.toISOString().split('T')[0];
        console.log("Parsed date:", formattedDate);
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        toast.error("Invalid date format. Please use YYYY-MM-DD format.");
        setFormLoading(false);
        return;
      }

      // Construct the transaction data with correct formatting
      const transactionData = {
        user_id: userData.user.id,
        type: formData.type,
        category_id: formData.category_id,
        amount: Number(amount.toFixed(2)), // Convert to fixed 2 decimal format
        description: formData.description ? formData.description.trim() : '', // Ensure empty string instead of null
        date: formattedDate, // Use the properly formatted date
        created_at: new Date().toISOString(), // Add timestamp
        updated_at: new Date().toISOString()  // Add timestamp
      };

      console.log("Submitting transaction data:", transactionData);

      if (isEditing && editTransaction) {
        // Update existing transaction
        try {
          console.log("Attempting to update transaction:", JSON.stringify(transactionData, null, 2));
          
          const { data, error } = await supabase
            .from("transactions")
            .update({
              ...transactionData,
              updated_at: new Date().toISOString() // Ensure updated timestamp
            })
            .eq("id", editTransaction.id)
            .eq("user_id", userData.user.id);
          
          if (error) {
            console.error("Detailed Supabase update error:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            throw error;
          }
          
          console.log("Transaction updated successfully");
          toast.success("Transaction updated successfully");
        } catch (updateError: any) {
          console.error("Transaction update error details:", {
            error: updateError,
            message: updateError.message,
            code: updateError.code,
            name: updateError.name
          });
          throw updateError;
        }
      } else {
        // Create new transaction
        try {
          // Log the data we're about to insert for debugging
          console.log("Attempting to insert transaction:", JSON.stringify(transactionData, null, 2));
          
          // First validate all fields are present and correctly formatted
          if (!transactionData.user_id) {
            throw new Error("Missing user_id");
          }
          
          if (!transactionData.category_id) {
            throw new Error("Missing category_id");
          }
          
          if (!transactionData.date) {
            throw new Error("Missing date");
          }
          
          // Insert with better error handling
          const { data, error } = await supabase
            .from("transactions")
            .insert([transactionData]);
            
          if (error) {
            console.error("Detailed Supabase insert error:", {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            throw error;
          }
          
          // Success - get the created record
          const { data: createdTransaction, error: fetchError } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: false })
            .limit(1);
            
          if (fetchError) {
            console.warn("Transaction was created but couldn't fetch the record:", fetchError);
          } else {
            console.log("Transaction created successfully:", createdTransaction);
          }
          
          toast.success("Transaction added successfully");
        } catch (insertError: any) {
          console.error("Transaction insert error details:", {
            error: insertError,
            message: insertError.message,
            code: insertError.code,
            name: insertError.name,
            stack: insertError.stack
          });
          throw insertError;
        }
      }

      // If recurring, handle that separately
      if (formData.is_recurring) {
        try {
          // Validate recurring frequency
          if (!formData.recurring_frequency) {
            toast.error("Please select a valid recurring frequency");
            return;
          }
          
          // Format the end date if present
          let formattedEndDate = null;
          if (formData.recurring_end_date) {
            try {
              const endDateObj = new Date(formData.recurring_end_date);
              if (!isNaN(endDateObj.getTime())) {
                formattedEndDate = endDateObj.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error("Error formatting recurring end date:", e);
            }
          }
          
          const recurringData = {
            user_id: userData.user.id,
            type: formData.type,
            category_id: formData.category_id,
            amount: amount,
            description: formData.description ? formData.description.trim() : '',
            frequency: formData.recurring_frequency,
            start_date: formattedDate, // Use the same formatted date
            end_date: formattedEndDate,
            active: true
          };

          const { data, error } = await supabase
            .from("recurring_transactions")
            .insert([recurringData])
            .select();

          if (error) {
            console.error("Error creating recurring transaction:", error);
            toast.error(`Transaction was added but failed to set up recurring schedule: ${error.message || 'Unknown error'}`);
          } else {
            console.log("Recurring transaction scheduled successfully:", data);
            toast.success("Recurring transaction scheduled successfully");
          }
        } catch (recurringError) {
          console.error("Error in recurring transaction setup:", recurringError);
          toast.error("Transaction was added but failed to set up recurring schedule");
        }
      }

      // Reset form and notify parent
      onTransactionAdded();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      let errorMessage = "Failed to save transaction";
      
      // Try to extract more useful error information
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        console.error("Error stack:", error.stack);
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        
        // Create a detailed error log for debugging
        console.error("Detailed error object:", JSON.stringify({
          message: errorObj.message,
          code: errorObj.code,
          details: errorObj.details,
          hint: errorObj.hint,
          statusCode: errorObj.statusCode,
          name: errorObj.name,
        }, null, 2));
        
        if (errorObj.message) {
          errorMessage += `: ${errorObj.message}`;
        } else if (errorObj.code) {
          errorMessage += ` (code: ${errorObj.code})`;
          
          // Provide user-friendly messages for common error codes
          if (errorObj.code === '23505') {
            errorMessage = "This transaction appears to be a duplicate";
          } else if (errorObj.code === '23503') {
            errorMessage = "Invalid category selected";
          } else if (errorObj.code === '42P01') {
            errorMessage = "Database configuration error. Please contact support.";
          } else if (errorObj.code === '28000') {
            errorMessage = "Authentication error. Please log in again.";
          }
        } else if (errorObj.details) {
          errorMessage += `: ${errorObj.details}`;
        }
      }
      
      // Add debugging info and record error in console
      console.error("Final error message:", errorMessage);
      
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Custom Category Form Component
  const CustomCategoryForm = () => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState("");
    
    // Only sync from parent to local state on mount and type change
    useEffect(() => {
      setInputValue(newCategory.name);
    }, [formData.type]);
    
    // Filter user's custom categories of the current type
    const userCustomCategories = useMemo(() => 
      categories.filter(c => 
        c.user_id && // Only user's custom categories
        (c.type === formData.type || c.type === 'both')
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [categories, formData.type]);
    
    // Pure local state handling for input - no parent state updates during typing
    const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };
    
    // Only update parent state when user is done typing (blur) or submitting
    const syncToParentState = useCallback(() => {
      const categoryType = formData.type === "income" ? "income" : "expense";
      setNewCategory({
        name: inputValue,
        type: categoryType
      });
    }, [formData.type, inputValue, setNewCategory]);
    
    // Remove unwanted dropdown elements that might appear
    useLayoutEffect(() => {
      const removeUnwantedDropdowns = () => {
        if (dropdownRef.current) {
          const unwantedDropdowns = dropdownRef.current.querySelectorAll(
            'select.flex-1, select.high-contrast-dropdown, select.categoryTypeDropdown'
          );
          unwantedDropdowns.forEach(el => el.remove());
        }
      };
      
      removeUnwantedDropdowns();
      const timer = setTimeout(removeUnwantedDropdowns, 100);
      return () => clearTimeout(timer);
    }, []);
    
    // Determine if we're creating an income or expense category
    const isIncome = formData.type === "income";
    const categoryType = isIncome ? "income" : "expense";
    
    return (
      <div ref={dropdownRef} className="space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleLocalInputChange}
            onBlur={syncToParentState}
            placeholder={`New ${categoryType} category name`}
            className={`w-full rounded-md border-2 ${customCategoryError ? 'border-red-500' : 'border-input'} bg-transparent px-3 py-2 text-sm font-medium`}
          />
          
          {/* This hidden input ensures we maintain the correct category type */}
          <input 
            type="hidden" 
            name="categoryType"
            value={categoryType} 
          />
          
          {/* Button for adding the category with appropriate styling */}
          <Button 
            type="button" 
            onClick={() => {
              // First sync local state to parent state
              syncToParentState();
              
              // Then add the category after a short delay
              setTimeout(() => handleAddCustomCategory(), 50);
            }}
            disabled={isSavingCategory || !inputValue.trim()}
            className={`w-full ${isIncome ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
          >
            {isSavingCategory ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current mr-2"></div>
                Saving {isIncome ? "Income" : "Expense"} Category...
              </>
            ) : (
              `Add ${isIncome ? "Income" : "Expense"} Category`
            )}
          </Button>
          
          {customCategoryError && (
            <p className="text-sm text-red-500">
              Please create a category or select an existing one
            </p>
          )}
        </div>
        
        {/* Display user's custom categories with delete option */}
        {userCustomCategories.length > 0 && (
          <div className="mt-4 border-2 border-red-200 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <h5 className="text-base font-medium mb-3 text-red-700 dark:text-red-300 flex items-center">
              <Trash className="h-4 w-4 mr-2"/> 
              Your Custom Categories
            </h5>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {userCustomCategories.map(category => (
                <div key={category.id} className="flex items-center justify-between py-3 px-3 rounded-md border border-red-200 bg-white dark:bg-red-900/10 hover:bg-red-100">
                  <span className="text-sm font-medium truncate flex-1">{category.name}</span>
                  <Button
                    variant="destructive"
                    size="default"
                    className="px-3 text-white bg-red-600 hover:bg-red-700 shadow-sm"
                    onClick={() => handleDeleteCategory(category)}
                    title="Delete category"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    <span>DELETE</span>
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-600 mt-2 font-medium">
              * Click DELETE to remove a custom category
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm md:items-center">
      <div className="flex flex-col w-full h-[95vh] md:h-auto md:max-h-[90vh] md:w-[90vw] max-w-md bg-card rounded-t-lg md:rounded-lg border shadow-lg md:mt-0 mt-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted active:scale-95 transition-transform"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form content with automatic scrolling */}
        <div className="overflow-y-auto flex-grow py-4 px-4 pb-24">
          <form id="transactionForm" className="space-y-4" onSubmit={handleSubmit}>
            {/* Type and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="transaction-type" className="mb-2 block text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="transaction-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={formLoading}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label htmlFor="transaction-amount" className="mb-2 block text-sm font-medium">
                  Amount <span className="text-red-500">*</span>
                </label>
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
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter amount in {currency}
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="transaction-category" className="mb-2 block text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="transaction-category"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                disabled={formLoading}
                className={`w-full rounded-md border ${customCategoryError ? 'border-red-500' : 'border-input'} bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary`}
                required
              >
                <option value="">Select a category</option>
                {categories
                  .filter(category => category.type === formData.type || category.type === 'both')
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                <option value="custom">+ Add new category</option>
              </select>
              {customCategoryError && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  Please select a valid category or create a new one
                </p>
              )}
              
              <p className="mt-1 mb-2 text-sm text-blue-600 font-medium">
                To delete categories, select "+ Add new category" option
              </p>

              {/* Show custom category form when "custom" is selected */}
              {formData.category_id === "custom" && (
                <div className="mt-3 p-4 border-2 border-primary rounded-md bg-primary/5 shadow-md">
                  <h4 className="text-base font-medium mb-3 flex items-center text-primary">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs mr-2">+</span>
                    Create New Category
                  </h4>
                  <CustomCategoryForm />
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="transaction-date" className="mb-2 block text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="transaction-date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                disabled={formLoading}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                pattern="\d{4}-\d{2}-\d{2}"
                max="2099-12-31"
                min="1900-01-01"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Format: YYYY-MM-DD
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="transaction-description" className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="transaction-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={formLoading}
                placeholder="Enter transaction details"
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional - Add details about this transaction (max 500 characters)
              </p>
            </div>

            {/* Add recurring transaction toggle */}
            {!isEditing && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_recurring" className="text-sm font-medium">
                  This is a recurring transaction
                </label>
              </div>
            )}
            
            {/* Show recurring options if recurring is checked */}
            {formData.is_recurring && (
              <div className="space-y-4 rounded-lg border bg-background p-4 mb-4">
                <div>
                  <label htmlFor="recurring_frequency" className="mb-2 block text-sm font-medium">
                    Frequency
                  </label>
                  <select
                    id="recurring_frequency"
                    name="recurring_frequency"
                    value={formData.recurring_frequency}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                    name="recurring_end_date"
                    value={formData.recurring_end_date}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave blank for indefinite recurring transactions
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {/* Action Buttons - Fixed at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card flex justify-end space-x-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={formLoading}
            className="px-8 py-2 bg-primary"
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
        
        {/* Confirmation dialog for deleting categories */}
        {showDeleteCategoryConfirm && categoryToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-card rounded-lg p-6 max-w-md w-full shadow-lg">
              <h3 className="text-lg font-bold mb-2">Delete Category</h3>
              <p className="mb-4">
                Are you sure you want to delete the category "{categoryToDelete.name}"?
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteCategoryConfirm(false);
                    setCategoryToDelete(null);
                  }}
                  disabled={isDeletingCategory}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteCategory}
                  disabled={isDeletingCategory}
                >
                  {isDeletingCategory ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
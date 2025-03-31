"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { validateAmount } from "@/lib/validation";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, X, DollarSign, Calendar, ChevronUp, ChevronDown, BarChart3, Info, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BudgetCharts } from './components/BudgetCharts';
import { SortableBudgetList } from './components/SortableBudgetList';
import { AnnualBudgetSummary } from './components/AnnualBudgetSummary';
import { Budget, CategorySpending, Category, BudgetFilter } from './types';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [existingBudgetToUpdate, setExistingBudgetToUpdate] = useState<Budget | null>(null);
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const [swipeCategoryId, setSwipeCategoryId] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedFab, setExpandedFab] = useState(false);
  const [showBudgetSelector, setShowBudgetSelector] = useState(false);
  const [budgetOptions, setBudgetOptions] = useState<Budget[]>([]);

  // Computed values
  const hasExpenseCategories = categories.some(c => c.type !== "income");
  
  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${userData.user.id}`)
        .eq('is_active', true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories", {
        description: "Please check your connection and try again",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*, categories(name)")
        .eq("user_id", userData.user.id);

      if (budgetError) throw budgetError;
      
      // Map budgets to include category name
      let mappedBudgets = budgetData?.map(budget => ({
        ...budget,
        category_name: budget.categories?.name || 'Uncategorized',
        order: budget.order || 0 // Ensure order property exists
      })) || [];
      
      // Sort budgets by order if available, otherwise use default order
      mappedBudgets.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setBudgets(mappedBudgets);

      // Fetch transactions to calculate spending by category
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("type", "expense");

      if (transactionError) throw transactionError;

      // Calculate spending by category_id
      const categoriesSpent: { [key: string]: number } = {};
      (transactionData || []).forEach((transaction) => {
        if (categoriesSpent[transaction.category_id]) {
          categoriesSpent[transaction.category_id] += transaction.amount;
        } else {
          categoriesSpent[transaction.category_id] = transaction.amount;
        }
      });

      // Fetch all categories to get names
      const { data: allCategories, error: categoryError } = await supabase
        .from("categories")
        .select("*");
        
      if (categoryError) throw categoryError;
      
      const categoryMap = new Map();
      (allCategories || []).forEach(cat => {
        categoryMap.set(cat.id, cat.name);
      });

      // Merge budget data with spending data
      const spending: CategorySpending[] = [];

      // First, add categories with budgets
      (mappedBudgets || []).forEach((budget) => {
        const spent = categoriesSpent[budget.category_id] || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        spending.push({
          category_id: budget.category_id,
          category_name: budget.category_name || 'Uncategorized',
          spent,
          budget: budget.amount,
          percentage,
        });
      });

      // Then, add categories without budgets but with spending
      Object.keys(categoriesSpent).forEach((category_id) => {
        if (!spending.some((s) => s.category_id === category_id)) {
          spending.push({
            category_id,
            category_name: categoryMap.get(category_id) || 'Uncategorized',
            spent: categoriesSpent[category_id],
            budget: 0,
            percentage: 100, // 100% of 0 budget
          });
        }
      });

      // Sort by percentage (highest first)
      spending.sort((a, b) => b.percentage - a.percentage);

      setCategorySpending(spending);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budget data", {
        description: "Please check your connection and try again",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear form error when user makes changes
    if (formError) {
      setFormError(null);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      amount: "",
      period: "monthly",
    });
    setIsEditing(false);
    setEditId(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setFormError("You must be logged in to save a budget");
        return;
      }

      // Validate the form data
      if (!formData.category_id) {
        setFormError("Please select a category");
        return;
      }
      
      const amountValidation = validateAmount(formData.amount);
      if (!amountValidation.isValid) {
        setFormError(amountValidation.message || "Invalid amount");
        return;
      }

      const amount = parseFloat(formData.amount);

      if (isEditing && editId) {
        // Update existing budget
        const { error } = await supabase
          .from("budgets")
          .update({
            category_id: formData.category_id,
            amount,
            period: formData.period as "monthly" | "weekly" | "yearly",
          })
          .eq("id", editId)
          .eq("user_id", userData.user.id);

        if (error) {
          console.error("Error updating budget:", error);
          setFormError(`Failed to update budget: ${error.message}`);
          return;
        }
        
        toast.success("Budget updated successfully", {
          description: "Your budget changes have been saved",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
      } else {
        // Check if budget for this category already exists
        const existingBudget = budgets.find(
          (b) => b.category_id === formData.category_id
        );

        if (existingBudget) {
          // Show confirmation modal instead of window.confirm
          setExistingBudgetToUpdate(existingBudget);
          setConfirmAction({
            title: "Update Existing Budget",
            message: "A budget for this category already exists. Do you want to update it?",
            action: async () => {
              try {
                if (!existingBudgetToUpdate) return;
                
                const { error } = await supabase
                  .from("budgets")
                  .update({
                    amount,
                    period: formData.period as "monthly" | "weekly" | "yearly",
                  })
                  .eq("id", existingBudgetToUpdate.id)
                  .eq("user_id", userData.user.id);

                if (error) {
                  console.error("Error updating existing budget:", error);
                  setFormError(`Failed to update budget: ${error.message}`);
                  return;
                }
                
                toast.success("Budget updated successfully", {
                  description: `Updated budget for ${categories.find(c => c.id === existingBudgetToUpdate.category_id)?.name || 'category'}`,
                  icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                });
                
                // Refresh budgets and reset form
                await fetchBudgets();
                resetForm();
                setShowForm(false);
              } catch (error: any) {
                console.error("Error updating budget:", error);
                toast.error("Failed to update budget", {
                  description: error?.message || "An unexpected error occurred",
                  icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
                });
              } finally {
                setFormLoading(false);
                setShowConfirmModal(false);
              }
            }
          });
          setShowConfirmModal(true);
          setFormLoading(false);
          return;
        } else {
          // Create new budget
          const { error } = await supabase.from("budgets").insert([
            {
              user_id: userData.user.id,
              category_id: formData.category_id,
              amount,
              period: formData.period,
            },
          ]);

          if (error) {
            console.error("Error creating new budget:", error);
            setFormError(`Failed to save budget: ${error.message}`);
            return;
          }
          
          toast.success("Budget created successfully", {
            description: `New budget for ${categories.find(c => c.id === formData.category_id)?.name || 'category'} has been created`,
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
        }
      }

      // Refresh budgets and reset form
      await fetchBudgets();
      resetForm();
      setShowForm(false);
    } catch (error: any) {
      console.error("Error saving budget:", error);
      setFormError(`${error?.message || "Unknown error"}`);
      toast.error("Failed to save budget", {
        description: error?.message || "An unexpected error occurred",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setIsEditing(true);
    setEditId(budget.id);
    setShowForm(true);
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    // Show confirmation modal instead of confirm
    setDeleteId(id);
    const budgetToDelete = budgets.find(b => b.id === id);
    setConfirmAction({
      title: "Delete Budget",
      message: `Are you sure you want to delete the budget for ${budgetToDelete?.category_name || 'this category'}?`,
      action: async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;

          const { error } = await supabase
            .from("budgets")
            .delete()
            .eq("id", id)
            .eq("user_id", userData.user.id);

          if (error) throw error;
          await fetchBudgets();
          toast.success("Budget deleted successfully", {
            description: "The budget has been removed from your account",
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
        } catch (error) {
          console.error("Error deleting budget:", error);
          toast.error("Failed to delete budget", {
            description: "An error occurred while trying to delete the budget",
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          });
        } finally {
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const getBudgetStatusMessage = () => {
    const overBudgetCount = categorySpending.filter(cat => cat.percentage > 100).length;
    if (overBudgetCount === 0) {
      return "All categories are within budget";
    } else if (overBudgetCount === 1) {
      return "1 category is over budget";
    } else {
      return `${overBudgetCount} categories are over budget`;
    }
  };

  // Add scroll indicator when first budget is added
  useEffect(() => {
    if (budgets.length > 0 && !showScrollIndicator) {
      setShowScrollIndicator(true);
      setTimeout(() => {
        setShowScrollIndicator(false);
      }, 3000);
    }
  }, [budgets.length]);

  // Add swipe gesture detection for mobile
  const handleTouchStart = (e: React.TouchEvent, categoryId: string) => {
    const touchX = e.touches[0].clientX;
    setSwipeStart(touchX);
    setSwipeCategoryId(categoryId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default to avoid unwanted scrolling during swipe
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStart === null || swipeCategoryId === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = swipeStart - touchEnd;
    
    // If swipe is significant (more than 100px)
    if (diff > 100) {
      // Swiped left - delete
      const budget = budgets.find(b => b.category_id === swipeCategoryId);
      if (budget) handleDelete(budget.id);
    } else if (diff < -100) {
      // Swiped right - edit
      const budget = budgets.find(b => b.category_id === swipeCategoryId);
      if (budget) handleEdit(budget);
    }
    
    setSwipeStart(null);
    setSwipeCategoryId(null);
  };

  // Scroll to top when form is opened
  useEffect(() => {
    if (showForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showForm]);

  const copyFromLastPeriod = async () => {
    setCopyLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Authentication error", {
          description: "You must be logged in to copy budgets",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        });
        setCopyLoading(false);
        return;
      }

      // Fetch existing budgets to populate the form
      const { data: previousBudgets, error: budgetError } = await supabase
        .from("budgets")
        .select("*, categories(name)")
        .eq("user_id", userData.user.id);
      
      if (budgetError) throw budgetError;
      
      if (!previousBudgets || previousBudgets.length === 0) {
        toast.error("No previous budgets found", {
          description: "There are no existing budgets to copy from",
          icon: <Info className="h-5 w-5 text-blue-500" />,
        });
        setCopyLoading(false);
        return;
      }
      
      // Map budgets to include category name
      const mappedBudgets = previousBudgets.map(budget => ({
        id: budget.id,
        user_id: budget.user_id,
        category_id: budget.category_id,
        category_name: budget.categories?.name || 'Uncategorized',
        amount: budget.amount,
        period: budget.period,
        created_at: budget.created_at
      }));
      
      // Set budget options
      setBudgetOptions(mappedBudgets);
      
      // Show budget selector
      setShowBudgetSelector(true);
      setCopyLoading(false);
    } catch (error: any) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to fetch budgets", {
        description: error?.message || "An unexpected error occurred",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
      setCopyLoading(false);
    }
  };
  
  const handleBudgetSelection = (budget: Budget) => {
    // Pre-populate the form with the selected budget data
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    
    // Make sure we're creating a new budget, not editing
    setIsEditing(false);
    setEditId(null);
    
    // Open the form for editing
    setShowForm(true);
    setShowBudgetSelector(false);
    
    // Show a helpful message
    toast.info("Budget copied to form", {
      description: `Review and save to create a new budget for ${budget.category_name}`,
      icon: <Info className="h-5 w-5 text-blue-500" />
    });
  };

  const handleReorderBudgets = async (reorderedBudgets: Budget[]) => {
    try {
      // Update local state immediately for responsiveness
      setBudgets(reorderedBudgets);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Prepare updates with new order values
      const updates = reorderedBudgets.map((budget, index) => ({
        id: budget.id,
        order: index,
      }));
      
      // Update order in database
      const { error } = await supabase
        .from("budgets")
        .upsert(updates, { onConflict: 'id' });
      
      if (error) {
        console.error("Error updating budget order:", error);
        toast.error("Failed to save order", {
          description: "Your changes may not persist after refresh",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        });
      }
    } catch (error) {
      console.error("Error handling budget reorder:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl relative" ref={scrollRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative h-10 w-10 flex-shrink-0"
          >
            <Image 
              src="/logo.svg" 
              alt="Budget Tracker Logo" 
              width={40} 
              height={40} 
              className="h-10 w-10" 
            />
          </motion.div>
          <div>
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              Budget Planner
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-sm"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              Set budgets and track your spending by category
            </motion.p>
          </div>
        </div>
        
        {/* Hide New Budget button on mobile - will show FAB instead */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="hidden md:flex space-x-2"
        >
          <Button
            onClick={() => copyFromLastPeriod()}
            className="relative overflow-hidden group"
            disabled={copyLoading}
          >
            <span className="relative z-10 flex items-center gap-1">
              {copyLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
                  Loading budgets...
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy From Last Period
                </>
              )}
            </span>
            <motion.div 
              className="absolute inset-0 bg-primary-gradient"
              animate={{ 
                x: ["0%", "100%"],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </Button>
          
          <Button 
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-1">
              {showForm ? <X size={16} /> : <Plus size={16} />}{" "}
              {showForm ? "Cancel" : "New Budget"}
            </span>
            <motion.div 
              className="absolute inset-0 bg-primary-gradient"
              animate={{ 
                x: ["0%", "100%"],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </Button>
        </motion.div>
      </div>

      {/* Show form errors in a more visible way */}
      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-6 border border-red-200 dark:border-red-800"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {formError}
                </h3>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Overview Cards - Improved with better visual hierarchy and responsive design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        {/* Total Budget Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Budget</h3>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                {budgets.length} budget{budgets.length !== 1 ? 's' : ''} set
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Spent</h3>
              <p className="text-2xl font-bold mt-1 text-red-500">
                {formatCurrency(categorySpending.reduce((sum, cat) => sum + cat.spent, 0))}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                Across {categorySpending.length} categor{categorySpending.length !== 1 ? 'ies' : 'y'}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Budget Status Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 ${categorySpending.some(cat => cat.percentage > 100) ? 'bg-red-500/5' : 'bg-emerald-500/5'} rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Budget Status</h3>
              <p className="text-2xl font-bold mt-1">
                {categorySpending.some(cat => cat.percentage > 100) 
                  ? <span className="text-red-500">Over Budget</span> 
                  : <span className="text-emerald-500">On Track</span>}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                {getBudgetStatusMessage()}
              </div>
            </div>
            <div className={`h-10 w-10 rounded-full ${categorySpending.some(cat => cat.percentage > 100) ? 'bg-red-500/10' : 'bg-emerald-500/10'} flex items-center justify-center`}>
              {categorySpending.some(cat => cat.percentage > 100) 
                ? <AlertTriangle className="h-5 w-5 text-red-500" />
                : <CheckCircle className="h-5 w-5 text-emerald-500" />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Add Annual Budget Summary */}
      {budgets.length > 0 && <AnnualBudgetSummary budgets={budgets} categorySpending={categorySpending} />}
      
      {/* Add Budget Charts */}
      {budgets.length > 0 && <BudgetCharts budgets={budgets} categorySpending={categorySpending} />}

      {/* Budget form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border rounded-lg p-4 md:p-6 mb-8 overflow-hidden shadow-md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {isEditing ? "Edit Budget" : "Add New Budget"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-muted-foreground hover:text-foreground touch-manipulation"
                  aria-label="Close form"
                  title="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-3 md:py-2 touch-manipulation"
                    disabled={formLoading || !hasExpenseCategories}
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter(c => c.type !== "income")
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  {!hasExpenseCategories && (
                    <p className="text-xs text-red-500 mt-1">
                      No expense categories available. Please create a category first.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Budget Amount
                  </label>
                  <ValidatedInput
                    id="amount"
                    name="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    prefix="$"
                    disabled={formLoading}
                    validationFn={validateAmount}
                  />
                </div>
                
                <div>
                  <label htmlFor="period" className="block text-sm font-medium mb-1">
                    Budget Period
                  </label>
                  <div className="relative">
                    <select
                      id="period"
                      name="period"
                      value={formData.period}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-3 md:py-2 appearance-none touch-manipulation"
                      disabled={formLoading}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <Calendar className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={formLoading}
                  className="w-full md:w-auto min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading}
                  className="w-full md:w-auto min-h-[44px]"
                >
                  {formLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      {isEditing ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>{isEditing ? "Update Budget" : "Save Budget"}</>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Progress - Modern visualization */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden mb-6">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Budget Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your spending against category budgets
          </p>
        </div>
        
        {categorySpending.length > 0 ? (
          <SortableBudgetList
            budgets={budgets}
            categorySpending={categorySpending}
            onReorder={handleReorderBudgets}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="p-8 text-center">
            <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No budgets set yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Start by creating your first budget to track your spending
            </p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Budget
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Budget Overview Table - Convert to cards on mobile */}
      {budgets.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">Budget Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all your budget configurations
            </p>
          </div>
          
          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">CATEGORY</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">PERIOD</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">AMOUNT</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {budgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2.5"></div>
                        <span className="font-medium">{budget.category_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize">{budget.period}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(budget.amount)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex space-x-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => handleEdit(budget)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile card view */}
          <div className="md:hidden p-4 space-y-3">
            {budgets.map((budget) => (
              <div 
                key={budget.id} 
                className="bg-card border rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                  <span className="font-medium">{budget.category_name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Period:</span>
                    <p className="font-medium capitalize">{budget.period}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium">{formatCurrency(budget.amount)}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => handleEdit(budget)}
                    aria-label={`Edit budget for ${budget.category_name}`}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(budget.id)}
                    aria-label={`Delete budget for ${budget.category_name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add a confirmation modal */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              className="bg-card rounded-lg shadow-lg max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start mb-4">
                <div className="bg-primary/10 rounded-full p-2 mr-3">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{confirmAction.title}</h3>
                  <p className="text-muted-foreground">{confirmAction.message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="min-w-[80px] min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => confirmAction.action()}
                  className="min-w-[80px] min-h-[44px]"
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll indicator for mobile */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div 
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-primary/90 text-white rounded-full px-4 py-2 shadow-lg z-40 text-sm md:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-2">
              <span>Swipe cards to edit or delete</span>
              <div className="flex gap-1">
                <motion.div 
                  animate={{ x: [0, -3, 0] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  ←
                </motion.div>
                <motion.div 
                  animate={{ x: [0, 3, 0] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button */}
      <AnimatePresence>
        {!showForm && (
          <motion.div
            className="fixed bottom-6 right-6 md:hidden z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <div className="relative">
              {/* Speed dial menu options */}
              <AnimatePresence>
                {expandedFab && (
                  <>
                    <motion.div
                      className="absolute bottom-16 right-0 mb-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", duration: 0.2 }}
                    >
                      <Button
                        onClick={() => copyFromLastPeriod()}
                        disabled={copyLoading}
                        size="sm"
                        className="h-12 px-3 rounded-full shadow-lg touch-manipulation flex items-center gap-1 bg-primary hover:bg-primary/90"
                        aria-label="Copy budgets from last period"
                      >
                        {copyLoading ? (
                          <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                        <span className="ml-1">Copy Last Period</span>
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      className="absolute bottom-28 right-0 mb-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", duration: 0.2, delay: 0.05 }}
                    >
                      <Button
                        onClick={() => {
                          resetForm();
                          setShowForm(true);
                          setExpandedFab(false);
                        }}
                        size="sm"
                        className="h-12 px-3 rounded-full shadow-lg touch-manipulation flex items-center gap-1 bg-primary hover:bg-primary/90"
                        aria-label="Add new budget"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="ml-1">New Budget</span>
                      </Button>
                    </motion.div>
                    
                    {/* Backdrop to close the menu when clicking outside */}
                    <motion.div
                      className="fixed inset-0 bg-black/20 z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setExpandedFab(false)}
                    />
                  </>
                )}
              </AnimatePresence>
              
              {/* Main FAB button */}
              <Button
                onClick={() => setExpandedFab(!expandedFab)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg p-0 touch-manipulation relative z-20"
                aria-label={expandedFab ? "Close menu" : "Open budget options"}
              >
                {expandedFab ? (
                  <X className="h-6 w-6" />
                ) : (
                  <DollarSign className="h-6 w-6" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Selector Modal */}
      <AnimatePresence>
        {showBudgetSelector && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBudgetSelector(false)}
          >
            <motion.div
              className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 max-h-[80vh] overflow-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">Select Budget to Copy</h3>
                  <p className="text-muted-foreground">Choose a budget to copy to the form:</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setShowBudgetSelector(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              
              <div className="space-y-3 mt-4">
                {budgetOptions.map((budget) => (
                  <div 
                    key={budget.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleBudgetSelection(budget)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{budget.category_name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{budget.period} budget</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(budget.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBudgetSelector(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { validateAmount } from "@/lib/validation";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, X, DollarSign, Calendar, ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  period: "monthly" | "weekly" | "yearly";
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
}

interface CategorySpending {
  category_id: string;
  category_name: string;
  spent: number;
  budget: number;
  percentage: number;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
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
      toast.error("Failed to load categories");
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
      const mappedBudgets = budgetData?.map(budget => ({
        ...budget,
        category_name: budget.categories?.name || 'Uncategorized'
      })) || [];
      
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
      toast.error("Failed to load budget data");
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
        
        toast.success("Budget updated successfully");
      } else {
        // Check if budget for this category already exists
        const existingBudget = budgets.find(
          (b) => b.category_id === formData.category_id
        );

        if (existingBudget) {
          // Confirm if the user wants to update
          if (!window.confirm("A budget for this category already exists. Do you want to update it?")) {
            setFormLoading(false);
            return;
          }

          // Update existing category
          const { error } = await supabase
            .from("budgets")
            .update({
              amount,
              period: formData.period as "monthly" | "weekly" | "yearly",
            })
            .eq("id", existingBudget.id)
            .eq("user_id", userData.user.id);

          if (error) {
            console.error("Error updating existing budget:", error);
            setFormError(`Failed to update budget: ${error.message}`);
            return;
          }
          
          toast.success("Existing budget updated successfully");
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
          
          toast.success("New budget created successfully");
        }
      }

      // Refresh budgets and reset form
      await fetchBudgets();
      resetForm();
      setShowForm(false);
    } catch (error: any) {
      console.error("Error saving budget:", error);
      setFormError(`${error?.message || "Unknown error"}`);
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
    if (!confirm("Are you sure you want to delete this budget?")) return;

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
      toast.success("Budget deleted successfully");
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
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

  const getProgressBarWidth = (percentage: number) => {
    return `${Math.min(percentage, 100)}%`;
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 85) return "bg-amber-500";
    if (percentage > 70) return "bg-amber-400";
    return "bg-emerald-500";
  };

  const getCategoryStatusIcon = (percentage: number) => {
    if (percentage > 100) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (percentage > 85) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
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
        
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
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

      {/* Budget Overview Cards - Improved with better visual hierarchy and responsive design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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

      {/* Budget form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-medium mb-4">
                {isEditing ? "Edit Budget" : "Create New Budget"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {formError && (
                    <motion.div 
                      className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{formError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category_id" className="block text-sm font-medium">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories
                          .filter(cat => cat.type === "expense" || cat.type === "both")
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                      <motion.div 
                        className="absolute bottom-0 left-0 h-[2px] bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: formData.category_id ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="amount" className="block text-sm font-medium">
                      Amount
                    </label>
                    <div className="relative">
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-muted-foreground sm:text-sm">$</span>
                        </div>
                        <ValidatedInput
                          id="amount"
                          name="amount"
                          type="text"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={handleInputChange}
                          validate={validateAmount}
                          label="Amount"
                          helperText="Enter the maximum amount for this budget"
                          className="block w-full rounded-md border-0 py-2 pl-7 pr-12 text-sm ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-primary"
                        />
                      </div>
                      <motion.div 
                        className="absolute bottom-0 left-0 h-[2px] bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: formData.amount ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="period" className="block text-sm font-medium">
                      Budget Period
                    </label>
                    <div className="relative">
                      <select
                        id="period"
                        name="period"
                        value={formData.period}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <motion.div 
                        className="absolute bottom-0 left-0 h-[2px] bg-primary"
                        initial={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit" 
                      disabled={formLoading}
                      className="relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {formLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            {isEditing ? "Update" : "Create"} Budget
                          </>
                        )}
                      </span>
                      <motion.div 
                        className="absolute inset-0 bg-primary-gradient"
                        animate={{ 
                          x: formLoading ? "0%" : ["0%", "100%"],
                        }}
                        transition={{ 
                          duration: formLoading ? 0 : 2, 
                          repeat: formLoading ? 0 : Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    </Button>
                  </motion.div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Progress - Modern visualization */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Budget Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your spending against category budgets
          </p>
        </div>
        
        {categorySpending.length > 0 ? (
          <div className="divide-y">
            {categorySpending.map((category) => (
              <div key={category.category_id}>
                <div 
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => toggleCategoryExpansion(category.category_id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryStatusIcon(category.percentage)}
                      <span className="font-medium">
                        {category.category_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`font-medium ${category.percentage > 100 ? 'text-red-500' : ''}`}>
                          {Math.round(category.percentage)}%
                        </span>
                      </div>
                      {expandedCategory === category.category_id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressBarColor(category.percentage)} transition-all`}
                      style={{ width: getProgressBarWidth(category.percentage) }}
                    ></div>
                  </div>
                </div>
                
                {expandedCategory === category.category_id && (
                  <div className="px-4 pb-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-md bg-background p-3 border">
                        <span className="text-muted-foreground">Spent</span>
                        <p className="font-medium text-lg">{formatCurrency(category.spent)}</p>
                      </div>
                      
                      <div className="rounded-md bg-background p-3 border">
                        <span className="text-muted-foreground">Budget</span>
                        <p className="font-medium text-lg">{formatCurrency(category.budget)}</p>
                      </div>
                      
                      <div className="rounded-md bg-background p-3 border">
                        <span className="text-muted-foreground">
                          {category.percentage > 100 ? 'Over Budget' : 'Remaining'}
                        </span>
                        <p className={`font-medium text-lg ${category.percentage > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {category.percentage > 100 
                            ? `${formatCurrency(category.spent - category.budget)}`
                            : `${formatCurrency(category.budget - category.spent)}`}
                        </p>
                      </div>
                    </div>
                    
                    {category.budget > 0 && (
                      <div className="mt-3 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const matchingBudget = budgets.find(b => b.category_id === category.category_id);
                            if (matchingBudget) {
                              handleEdit(matchingBudget);
                            }
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Budget
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
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
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Budget
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Budget Overview Table - Improved with better structure */}
      {budgets.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">Budget Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all your budget configurations
            </p>
          </div>
          
          <div className="overflow-x-auto">
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
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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

      // Then, add categories without budgets
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

      setCategorySpending(spending);
    } catch (error) {
      console.error("Error fetching budgets:", error);
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
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      amount: "",
      period: "monthly",
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("You must be logged in to save a budget");
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      if (!formData.category_id) {
        alert("Please select a category");
        return;
      }

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
          alert(`Failed to update budget: ${error.message}`);
          return;
        }
      } else {
        // Check if budget for this category already exists
        const existingBudget = budgets.find(
          (b) => b.category_id === formData.category_id
        );

        if (existingBudget) {
          if (!confirm("A budget for this category already exists. Do you want to update it?")) {
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
            alert(`Failed to update budget: ${error.message}`);
            return;
          }
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
            alert(`Failed to save budget: ${error.message}`);
            return;
          }
        }
      }

      // Refresh budgets and reset form
      await fetchBudgets();
      resetForm();
      setShowForm(false);
      alert("Budget saved successfully!");
    } catch (error: any) {
      console.error("Error saving budget:", error);
      alert(`Failed to save budget: ${error?.message || "Unknown error"}`);
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
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Failed to delete budget");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Budget Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Budget"}
        </Button>
      </div>

      {/* Budget Overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Budget Allocated</h3>
          <p className="text-2xl font-bold">
            {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {budgets.length} budget{budgets.length !== 1 ? 's' : ''} set
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Spent</h3>
          <p className="text-2xl font-bold text-destructive">
            {formatCurrency(categorySpending.reduce((sum, cat) => sum + cat.spent, 0))}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Across {categorySpending.length} categor{categorySpending.length !== 1 ? 'ies' : 'y'}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm relative overflow-hidden">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Budget Status</h3>
          <p className="text-2xl font-bold">
            {categorySpending.some(cat => cat.percentage > 100) 
              ? <span className="text-gradient-danger">Over Budget</span> 
              : <span className="text-gradient-success">On Track</span>}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {categorySpending.filter(cat => cat.percentage > 100).length} categor{categorySpending.filter(cat => cat.percentage > 100).length !== 1 ? 'ies' : 'y'} over budget
          </div>
          
          {/* Visual indicator */}
          <div className="absolute bottom-0 left-0 w-full h-1">
            <div 
              className={categorySpending.some(cat => cat.percentage > 100) ? "bg-gradient-danger" : "bg-gradient-success"} 
              style={{width: "100%", height: "100%"}}
            ></div>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Budget Progress</h2>
        {categorySpending.length > 0 ? (
          <div className="space-y-4">
            {categorySpending.map((category) => (
              <div key={category.category_id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      category.percentage > 100 ? 'bg-red-500' : 
                      category.percentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                    }`}></span>
                    {category.category_name}
                  </span>
                  <span>
                    {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`${
                      category.percentage > 100
                        ? "progress-bar-danger"
                        : category.percentage > 80
                        ? "progress-bar-warning"
                        : "progress-bar-success"
                    }`}
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{category.percentage.toFixed(0)}% used</span>
                  {category.percentage > 100 && (
                    <span className="text-red-500">Over budget by {formatCurrency(category.spent - category.budget)}</span>
                  )}
                  {category.percentage <= 100 && (
                    <span>{formatCurrency(category.budget - category.spent)} remaining</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No budget set</p>
        )}
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {isEditing ? "Edit Budget" : "Add Budget"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-medium">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 bg-background p-2 dark:border-gray-600"
                required
                disabled={isEditing}
                aria-label="Category selection"
              >
                <option value="">Select a category</option>
                {categories
                  .filter(cat => cat.type === 'expense' || cat.type === 'both')
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 bg-background p-2 dark:border-gray-600"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Period</label>
              <select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 bg-background p-2 dark:border-gray-600"
                aria-label="Budget period"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <Button type="submit" className="w-full">
              {isEditing ? "Update Budget" : "Add Budget"}
            </Button>
          </form>
        </div>
      )}

      {/* Budget Limits */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Budget Limits</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left dark:border-gray-700">
                <th className="pb-2 font-medium">CATEGORY</th>
                <th className="pb-2 font-medium">PERIOD</th>
                <th className="pb-2 font-medium">AMOUNT</th>
                <th className="pb-2 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length > 0 ? (
                budgets.map((budget) => (
                  <tr key={budget.id} className="border-b dark:border-gray-700">
                    <td className="py-3">
                      <span className="flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2"></span>
                        {budget.category_name}
                      </span>
                    </td>
                    <td className="py-3 capitalize">{budget.period}</td>
                    <td className="py-3">{formatCurrency(budget.amount)}</td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(budget)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-muted-foreground">
                    No budgets found. Start by adding your first budget!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
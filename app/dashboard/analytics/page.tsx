"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
  Brush
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Custom styles for enhanced chart interactions
const styles = {
  chartCard: "rounded-xl border bg-card p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]",
  chartTitle: "mb-4 text-lg font-semibold",
  interactiveCell: "cursor-pointer transition-all duration-300 hover:opacity-80 hover:scale-105",
  tooltipStyles: { 
    backgroundColor: 'var(--card)', 
    borderColor: 'var(--border)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid var(--border)',
    fontSize: '0.9rem'
  },
  tooltipItemStyles: { 
    color: 'var(--foreground)', 
    padding: '0.25rem 0' 
  },
  tooltipLabelStyles: { 
    color: 'var(--foreground)', 
    fontWeight: 'bold', 
    marginBottom: '0.5rem' 
  }
};

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

interface BudgetData {
  name: string;
  budget: number;
  actual: number;
  color: string;
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomeByCategory, setIncomeByCategory] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("6m"); // 1m, 3m, 6m, 1y, all
  const [categoryInsights, setCategoryInsights] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [topExpenseCategories, setTopExpenseCategories] = useState<any[]>([]);
  const [yearlyComparison, setYearlyComparison] = useState<any[]>([]);
  const [categoriesBudgetData, setCategoriesBudgetData] = useState<BudgetData[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      processData();
    }
  }, [transactions]);

  useEffect(() => {
    if (transactions.length > 0) {
      processAdvancedInsights();
    }
  }, [transactions, selectedTimeframe]);

  useEffect(() => {
    // Initialize data for charts
    setExpenseByCategory([
      // ... existing code ...
    ]);

    setIncomeByCategory([
      // ... existing code ...
    ]);

    setMonthlyData([
      // ... existing code ...
    ]);

    // Initialize top expense categories
    setTopExpenseCategories([
      // ... existing code ...
    ]);

    // Initialize yearly comparison data
    setYearlyComparison([
      // ... existing code ...
    ]);

    // Initialize budget data for categories
    setCategoriesBudgetData([
      { name: "Housing", budget: 1200, actual: 1250, color: "#38BDF8" },
      { name: "Food", budget: 500, actual: 650, color: "#F472B6" },
      { name: "Transportation", budget: 300, actual: 280, color: "#22C55E" },
      { name: "Entertainment", budget: 200, actual: 320, color: "#F59E0B" },
      { name: "Healthcare", budget: 150, actual: 110, color: "#6366F1" },
      { name: "Shopping", budget: 250, actual: 280, color: "#EC4899" },
      { name: "Utilities", budget: 180, actual: 175, color: "#8B5CF6" },
      { name: "Education", budget: 100, actual: 90, color: "#10B981" }
    ]);
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          categories:category_id (
            name,
            type
          )
        `)
        .eq("user_id", userData.user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      
      const processedData = data?.map(transaction => ({
        ...transaction,
        category_name: transaction.categories?.name || 'Uncategorized'
      }));
      
      setTransactions(processedData || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    processCategories();
    processMonthlyData();
  };

  const processAdvancedInsights = () => {
    const today = new Date();
    let startDate = new Date();
    
    switch (selectedTimeframe) {
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
      default:
        startDate = new Date(0); // Beginning of time
    }
    
    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate && new Date(t.date) <= today
    );
    
    const months: {[key: string]: {income: number, expense: number, balance: number}} = {};
    
    const numMonths = selectedTimeframe === "1m" ? 6 : // Show 6 months even for 1m selection
                     selectedTimeframe === "3m" ? 6 :
                     selectedTimeframe === "6m" ? 6 :
                     selectedTimeframe === "1y" ? 12 : 12;
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = month.toLocaleString('default', { month: 'short' });
      months[monthKey] = { income: 0, expense: 0, balance: 0 };
    }
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      if (date >= new Date(today.getFullYear(), today.getMonth() - (numMonths - 1), 1)) {
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (months[monthKey]) {
          if (t.type === 'income') {
            months[monthKey].income += t.amount;
          } else {
            months[monthKey].expense += t.amount;
          }
        }
      }
    });
    
    Object.keys(months).forEach(month => {
      months[month].balance = months[month].income - months[month].expense;
    });
    
    const trendsData = Object.keys(months).map(month => ({
      name: month,
      income: months[month].income,
      expense: months[month].expense,
      balance: months[month].balance
    }));
    
    setMonthlyTrends(trendsData);
    
    const expenseTransactions = filteredTransactions.filter(t => t.type === "expense");
    const expenseMap: Record<string, number> = {};
    
    expenseTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      if (expenseMap[category]) {
        expenseMap[category] += t.amount;
      } else {
        expenseMap[category] = t.amount;
      }
    });
    
    const totalExpenses = Object.values(expenseMap).reduce((sum, amount) => sum + amount, 0);
    
    const insights = Object.keys(expenseMap).map((category, index) => {
      const value = expenseMap[category];
      const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
      
      return {
        name: category,
        value,
        color: COLORS[index % COLORS.length],
        percentage
      };
    });
    
    insights.sort((a, b) => b.value - a.value);
    
    setCategoryInsights(insights);
    setTopExpenseCategories(insights.slice(0, 5));
  };

  const COLORS = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
    "#FF9F40", "#8AC926", "#1982C4", "#6A4C93", "#F15BB5"
  ];

  const processCategories = () => {
    // Process income by category
    const incomeTransactions = transactions.filter(t => t.type === "income");
    const incomeMap: Record<string, number> = {};

    incomeTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      if (incomeMap[category]) {
        incomeMap[category] += t.amount;
      } else {
        incomeMap[category] = t.amount;
      }
    });

    const incomeData = Object.keys(incomeMap).map((category, index) => ({
      name: category,
      value: incomeMap[category],
      color: COLORS[index % COLORS.length],
    }));

    setIncomeByCategory(incomeData);

    // Process expenses by category
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    const expenseMap: Record<string, number> = {};

    expenseTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      if (expenseMap[category]) {
        expenseMap[category] += t.amount;
      } else {
        expenseMap[category] = t.amount;
      }
    });

    const expenseData = Object.keys(expenseMap).map((category, index) => ({
      name: category,
      value: expenseMap[category],
      color: COLORS[index % COLORS.length],
    }));

    setExpenseByCategory(expenseData);
  };

  const processMonthlyData = () => {
    const months: {[key: string]: {income: number, expense: number}} = {};
    const today = new Date();
    
    // Initialize the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = month.toLocaleString('default', { month: 'short' });
      months[monthKey] = { income: 0, expense: 0 };
    }
    
    // Populate with transaction data
    transactions.forEach(t => {
      const date = new Date(t.date);
      // Only consider last 6 months
      if (date >= new Date(today.getFullYear(), today.getMonth() - 5, 1)) {
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (months[monthKey]) {
          if (t.type === 'income') {
            months[monthKey].income += t.amount;
          } else {
            months[monthKey].expense += t.amount;
          }
        }
      }
    });
    
    // Convert to array format for chart
    const monthlyData = Object.keys(months).map(month => ({
      name: month,
      income: months[month].income,
      expense: months[month].expense
    }));
    
    setMonthlyData(monthlyData);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:p-6 lg:p-8 max-w-screen-xl">
      {/* Header section with gradient text */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold md:text-4xl bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent" tabIndex={0}>
          Analytics Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Gain valuable insights into your financial patterns and spending habits.
        </p>
      </header>
      
      {/* Enhanced Time Period Filter */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Time Period</h2>
        <div className="flex items-center space-x-2 rounded-xl bg-muted/50 p-1">
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedTimeframe === "1m" 
                ? "bg-background shadow-sm text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedTimeframe("1m")}
          >
            1 Month
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedTimeframe === "3m" 
                ? "bg-background shadow-sm text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedTimeframe("3m")}
          >
            3 Months
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedTimeframe === "6m" 
                ? "bg-background shadow-sm text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedTimeframe("6m")}
          >
            6 Months
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedTimeframe === "1y" 
                ? "bg-background shadow-sm text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedTimeframe("1y")}
          >
            1 Year
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedTimeframe === "all" 
                ? "bg-background shadow-sm text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedTimeframe("all")}
          >
            All Time
          </button>
        </div>
      </div>
      
      {/* Enhanced Summary Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary to-violet-400 text-white">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
              <p className="text-2xl font-bold mt-1">{transactions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Income</div>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <TrendingUp size={20} className="rotate-180" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <PieChartIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Categories</div>
              <p className="text-2xl font-bold mt-1">
                {Array.from(new Set(transactions.map(t => t.category_name))).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for different insights */}
      <Tabs defaultValue="trends" className="mb-6">
        <TabsList className="mb-6 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart2 className="mr-2 h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6 animate-fade-in">
          {/* Monthly Spending Trends */}
          <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Monthly Financial Trends</h2>
              <div className="flex items-center text-sm text-muted-foreground mt-2 sm:mt-0">
                <span className="flex items-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Income
                </span>
                <span className="flex items-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                  Expenses
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></span>
                  Balance
                </span>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tick={{ fill: 'var(--muted-foreground)' }}
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      if (value >= 1000) return `${value/1000}k`;
                      return value.toString();
                    }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'var(--muted-foreground)' }}
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      if (value >= 1000) return `${value/1000}k`;
                      return value.toString();
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderColor: 'var(--border)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    name="Income"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="expense" 
                    fill="#ef4444"
                    name="Expenses"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={25}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="balance"
                    stroke="#6366f1"
                    strokeWidth={3}
                    name="Balance"
                    dot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Financial Insights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Average Monthly Income */}
            <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Monthly Income</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      monthlyTrends.reduce((sum, month) => sum + month.income, 0) / monthlyTrends.length || 0
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="mt-5 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Average Monthly Expense */}
            <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Monthly Expense</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      monthlyTrends.reduce((sum, month) => sum + month.expense, 0) / monthlyTrends.length || 0
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className="mt-5 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Savings Rate */}
            <div className="rounded-xl border bg-card p-5 shadow-md hover:shadow-lg transition-shadow duration-300 hover-lift">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Monthly Savings Rate</h3>
                  <p className="text-2xl font-bold text-primary">
                    {(() => {
                      const totalIncome = monthlyTrends.reduce((sum, month) => sum + month.income, 0);
                      const totalExpense = monthlyTrends.reduce((sum, month) => sum + month.expense, 0);
                      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
                      return `${savingsRate.toFixed(1)}%`;
                    })()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-primary to-violet-400"
                  style={{ 
                    width: (() => {
                      const totalIncome = monthlyTrends.reduce((sum, month) => sum + month.income, 0);
                      const totalExpense = monthlyTrends.reduce((sum, month) => sum + month.expense, 0);
                      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
                      // Constrain between 0 and 100%
                      return `${Math.max(0, Math.min(100, savingsRate))}%`;
                    })() 
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(() => {
                  const totalIncome = monthlyTrends.reduce((sum, month) => sum + month.income, 0);
                  const totalExpense = monthlyTrends.reduce((sum, month) => sum + month.expense, 0);
                  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
                  
                  if (savingsRate > 20) return 'Excellent savings rate! Keep it up!';
                  if (savingsRate > 10) return 'Good savings rate. You\'re on track.';
                  if (savingsRate > 0) return 'Positive savings. Consider increasing if possible.';
                  return 'Expenses exceeding income. Review your budget.';
                })()}
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Expense Breakdown by Category */}
          <div className={styles.chartCard}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <h2 className={styles.chartTitle}>Expense Breakdown by Category</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-medium">
                  Expense Analysis
                </span>
                {expenseByCategory.length > 0 && (
                  <span className="text-xs px-2.5 py-1 bg-muted rounded-full font-medium">
                    {expenseByCategory.length} categories
                  </span>
                )}
              </div>
            </div>
            
            {/* Add expense breakdown chart content here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {expenseByCategory.map((entry, index) => (
                          <filter key={`expense-shadow-${index}`} id={`expense-shadow-${index}`} height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={entry.color} floodOpacity="0.5"/>
                          </filter>
                        ))}
                        {/* Add gradients for each expense category */}
                        {expenseByCategory.map((entry, index) => (
                          <linearGradient key={`expense-gradient-${index}`} id={`expenseGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        innerRadius={40}
                        paddingAngle={3}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={800}
                        animationBegin={200}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                          const RADIAN = Math.PI / 180;
                          // Only show labels for segments > 5%
                          if (percent < 0.05) return null;
                          
                          // Calculate position for label with more distance
                          const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          // Show percentage and amount for important categories (>10%)
                          const isLargeSegment = percent > 0.1;
                          
                          return (
                            <g>
                              <text 
                                x={x} 
                                y={y}
                                fill={expenseByCategory[index].color}
                                textAnchor={x > cx ? 'start' : 'end'} 
                                dominantBaseline="central"
                                filter={`url(#expense-shadow-${index})`}
                                fontWeight="bold"
                                className="text-xs font-medium"
                              >
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                              {isLargeSegment && (
                                <text 
                                  x={x} 
                                  y={y + 15}
                                  fill={expenseByCategory[index].color}
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  fontSize="10"
                                  opacity="0.8"
                                >
                                  {formatCurrency(expenseByCategory[index].value).substring(0, 6)}
                                </text>
                              )}
                            </g>
                          );
                        }}
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#expenseGradient-${index})`}
                            stroke="var(--card)" 
                            strokeWidth={1}
                            className={styles.interactiveCell}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), "Amount"]}
                        contentStyle={styles.tooltipStyles}
                        itemStyle={styles.tooltipItemStyles}
                        labelStyle={styles.tooltipLabelStyles}
                        wrapperStyle={{ outline: 'none' }}
                        isAnimationActive={true}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ paddingLeft: 20, fontSize: 12 }}
                        iconType="circle"
                        iconSize={10}
                        formatter={(value, entry) => {
                          // Truncate long category names
                          const displayName = value.length > 14 ? `${value.substring(0, 14)}...` : value;
                          return (
                            <span className="text-foreground hover:text-primary transition-colors duration-200 cursor-pointer">
                              {displayName}
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Add spending insights below the chart */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-1">Top Category</div>
                    <div className="flex items-center">
                      {expenseByCategory.length > 0 && (
                        <>
                          <span 
                            className="mr-2 h-3 w-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: expenseByCategory[0].color }}
                          ></span>
                          <span className="font-medium truncate text-sm">
                            {expenseByCategory.length > 0 ? expenseByCategory[0].name : "N/A"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-1">Categories Count</div>
                    <div className="font-medium text-sm">
                      {expenseByCategory.length} categories
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="scrollbar-hide overflow-auto max-h-[300px]">
                  <table className="w-full">
                    <thead className="border-b sticky top-0 bg-card z-10">
                      <tr>
                        <th className="pb-2 pt-1 text-left font-medium text-muted-foreground">Category</th>
                        <th className="pb-2 pt-1 text-right font-medium text-muted-foreground">Amount</th>
                        <th className="pb-2 pt-1 text-right font-medium text-muted-foreground">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expenseByCategory.map((category, index) => {
                        const totalExpense = expenseByCategory.reduce((sum, cat) => sum + cat.value, 0);
                        const percentage = totalExpense > 0 ? (category.value / totalExpense) * 100 : 0;
                        
                        return (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 text-left">
                              <div className="flex items-center">
                                <span 
                                  className="mr-2 h-3 w-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: category.color }}
                                ></span>
                                <span className="truncate max-w-[150px]" title={category.name}>
                                  {category.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-medium">
                              {formatCurrency(category.value)}
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Add spending metrics and insights */}
                <div className="mt-auto pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Spending Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Average per Category</div>
                      <div className="font-medium">
                        {formatCurrency(
                          expenseByCategory.length > 0
                            ? expenseByCategory.reduce((sum, cat) => sum + cat.value, 0) / expenseByCategory.length
                            : 0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Top 3 Categories</div>
                      <div className="font-medium">
                        {formatCurrency(
                          expenseByCategory.slice(0, 3).reduce((sum, cat) => sum + cat.value, 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Monthly Balance Trends */}
          <div className={styles.chartCard}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <h2 className={styles.chartTitle}>Monthly Balance Trends</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                  Balance Analysis
                </span>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--muted-foreground)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--muted-foreground)' }} 
                    tickFormatter={(value: number) => formatCurrency(value, true as any)} 
                    tickLine={{ stroke: 'var(--border)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), "Balance"]}
                    contentStyle={styles.tooltipStyles}
                    itemStyle={styles.tooltipItemStyles}
                    labelStyle={styles.tooltipLabelStyles}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#0EA5E9"
                    fill="url(#colorBalance)"
                    activeDot={{ 
                      r: 6, 
                      className: "animate-pulse",
                      strokeWidth: 3
                    }}
                    strokeWidth={2}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                  {/* Add a custom brush for date range selection */}
                  <Brush 
                    dataKey="name"
                    height={30}
                    stroke="#8884d8"
                    fill="var(--background)"
                    travellerWidth={10}
                    className="mt-4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Insights Card */}
          <div className="rounded-xl border bg-card p-5 shadow-md transition-shadow duration-300 hover:shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
              <h2 className="text-lg font-semibold">Budget Performance</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                  Budget Analysis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget vs. Actual Visualization */}
              <div className="h-full">
                <div className="mb-4 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        ...categoriesBudgetData.map(cat => ({
                          name: cat.name,
                          budget: cat.budget,
                          actual: cat.actual,
                          color: cat.color,
                          variance: cat.actual - cat.budget,
                          variancePercentage: cat.budget > 0 ? (cat.actual - cat.budget) / cat.budget * 100 : 0
                        }))
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        angle={-40}
                        textAnchor="end"
                        tickMargin={10}
                        height={60}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value).substring(0, 4)}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'budget') return [formatCurrency(value as number), 'Budget'];
                          if (name === 'actual') return [formatCurrency(value as number), 'Actual'];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          borderColor: 'var(--border)',
                          borderRadius: '0.75rem',
                          padding: '0.75rem 1rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid var(--border)',
                          fontSize: '0.9rem'
                        }}
                        itemStyle={{ color: 'var(--foreground)', padding: '0.25rem 0' }}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '0.5rem' }}
                      />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#94A3B8" radius={[4, 4, 0, 0]}>
                        {categoriesBudgetData.map((entry, index) => (
                          <Cell key={`cell-budget-${index}`} fill="#94A3B8" opacity={0.7} />
                        ))}
                      </Bar>
                      <Bar dataKey="actual" name="Actual" fill="#38BDF8" radius={[4, 4, 0, 0]}>
                        {categoriesBudgetData.map((entry, index) => {
                          // Red for over budget, green for under budget
                          const isOverBudget = entry.actual > entry.budget;
                          return (
                            <Cell 
                              key={`cell-actual-${index}`} 
                              fill={isOverBudget ? '#F87171' : '#4ADE80'} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Total Budget Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Budget Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {/* Total Budget */}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Total Budget</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(categoriesBudgetData.reduce((sum, cat) => sum + cat.budget, 0))}
                      </span>
                    </div>
                    
                    {/* Total Actual */}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Total Actual</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(categoriesBudgetData.reduce((sum, cat) => sum + cat.actual, 0))}
                      </span>
                    </div>
                    
                    {/* Variance */}
                    {(() => {
                      const totalBudget = categoriesBudgetData.reduce((sum, cat) => sum + cat.budget, 0);
                      const totalActual = categoriesBudgetData.reduce((sum, cat) => sum + cat.actual, 0);
                      const variance = totalActual - totalBudget;
                      const isOverBudget = variance > 0;
                      
                      return (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Variance</span>
                          <span className={`text-lg font-semibold ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                            {isOverBudget ? '+' : ''}{formatCurrency(variance)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Budget Details Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="text-sm font-medium">Budget Details by Category</h3>
                </div>
                <div className="overflow-auto max-h-[300px]">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-xs">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Category</th>
                        <th className="py-3 px-2 text-right font-medium">Budget</th>
                        <th className="py-3 px-2 text-right font-medium">Actual</th>
                        <th className="py-3 px-4 text-right font-medium">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {categoriesBudgetData.map((category, index) => {
                        const variance = category.actual - category.budget;
                        const isOverBudget = variance > 0;
                        const variancePercentage = category.budget > 0 
                          ? (variance / category.budget) * 100 
                          : 0;
                        
                        return (
                          <tr key={index} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full mr-2" 
                                  style={{ backgroundColor: category.color }}
                                ></span>
                                {category.name}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium">
                              {formatCurrency(category.budget)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium">
                              {formatCurrency(category.actual)}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end">
                                <span 
                                  className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}
                                >
                                  {isOverBudget ? '+' : ''}{formatCurrency(variance)}
                                </span>
                                <div 
                                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-sm ${
                                    isOverBudget ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}
                                >
                                  {isOverBudget ? '+' : ''}{variancePercentage.toFixed(0)}%
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Budget Insights */}
            <div className="mt-6 border rounded-lg p-4 bg-muted/10">
              <h3 className="text-sm font-medium mb-3">Budget Insights</h3>
              {categoriesBudgetData.length > 0 ? (
                <div>
                  {(() => {
                    // Calculate insights
                    const overBudgetCategories = categoriesBudgetData.filter(cat => cat.actual > cat.budget);
                    const biggestOverBudget = [...categoriesBudgetData].sort((a, b) => 
                      (b.actual - b.budget) - (a.actual - a.budget)
                    )[0];
                    const mostEfficientCategory = [...categoriesBudgetData]
                      .filter(cat => cat.budget > 0)
                      .sort((a, b) => 
                        (a.actual / a.budget) - (b.actual / b.budget)
                      )[0];
                    
                    return (
                      <div className="text-sm space-y-3">
                        {/* Summary insight */}
                        <div className="p-3 rounded-lg bg-card border">
                          <p>
                            {overBudgetCategories.length > 0 ? (
                              `You have ${overBudgetCategories.length} ${overBudgetCategories.length === 1 ? 'category' : 'categories'} over budget.
                               ${overBudgetCategories.length > 0 ? 'Consider reviewing your spending habits in ' + overBudgetCategories.map(cat => cat.name).join(', ') + '.' : ''}`
                            ) : (
                              'Excellent! All categories are within budget.'
                            )}
                          </p>
                        </div>
                        
                        {/* Most over budget category */}
                        {biggestOverBudget && biggestOverBudget.actual > biggestOverBudget.budget && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-card border">
                              <div className="flex items-center text-red-500 mb-1">
                                <AlertTriangle size={14} className="mr-1" />
                                <span className="font-medium">Needs Attention</span>
                              </div>
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">{biggestOverBudget.name}</span> has the highest budget variance. 
                                You spent {formatCurrency(biggestOverBudget.actual - biggestOverBudget.budget)} more than planned 
                                ({((biggestOverBudget.actual - biggestOverBudget.budget) / biggestOverBudget.budget * 100).toFixed(0)}% over).
                              </p>
                            </div>
                            
                            {/* Best performing category */}
                            {mostEfficientCategory && (
                              <div className="p-3 rounded-lg bg-card border">
                                <div className="flex items-center text-green-500 mb-1">
                                  <CheckCircle2 size={14} className="mr-1" />
                                  <span className="font-medium">Well Done</span>
                                </div>
                                <p className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{mostEfficientCategory.name}</span> is well-managed. 
                                  You've used only {((mostEfficientCategory.actual / mostEfficientCategory.budget) * 100).toFixed(0)}% of the allocated budget.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No budget data available</div>
              )}
            </div>
          </div>

          {/* Income by Category */}
          <div className={styles.chartCard}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <h2 className={styles.chartTitle}>Income Sources</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                  Income Analysis
                </span>
                {incomeByCategory.length > 0 && (
                  <span className="text-xs px-2.5 py-1 bg-muted rounded-full font-medium">
                    {incomeByCategory.length} sources
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Pie chart in 3 columns */}
              <div className="md:col-span-3">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {incomeByCategory.map((entry, index) => (
                          <filter key={`income-shadow-enhanced-${index}`} id={`income-shadow-enhanced-${index}`} height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={entry.color} floodOpacity="0.5"/>
                          </filter>
                        ))}
                        {/* Add gradients for each income category */}
                        {incomeByCategory.map((entry, index) => (
                          <linearGradient key={`income-gradient-${index}`} id={`incomeGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={4}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1000}
                        animationBegin={300}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                          const RADIAN = Math.PI / 180;
                          // Only show labels for segments > 5%
                          if (percent < 0.05) return null;
                          
                          // Calculate position for label with more distance
                          const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          // Show percentage and amount for important categories (>15%)
                          const isLargeSegment = percent > 0.15;
                          
                          return (
                            <g>
                              <text 
                                x={x} 
                                y={y}
                                fill={incomeByCategory[index].color}
                                textAnchor={x > cx ? 'start' : 'end'} 
                                dominantBaseline="central"
                                filter={`url(#income-shadow-enhanced-${index})`}
                                fontWeight="bold"
                                className="text-xs font-medium"
                              >
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                              {isLargeSegment && (
                                <text 
                                  x={x} 
                                  y={y + 15}
                                  fill={incomeByCategory[index].color}
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  fontSize="10"
                                  opacity="0.8"
                                >
                                  {formatCurrency(incomeByCategory[index].value).substring(0, 6)}
                                </text>
                              )}
                            </g>
                          );
                        }}
                      >
                        {incomeByCategory.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#incomeGradient-${index})`}
                            stroke="var(--card)" 
                            strokeWidth={1}
                            className={styles.interactiveCell}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), "Amount"]}
                        contentStyle={styles.tooltipStyles}
                        itemStyle={styles.tooltipItemStyles}
                        labelStyle={styles.tooltipLabelStyles}
                        wrapperStyle={{ outline: 'none' }}
                        isAnimationActive={true}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Income source details in 2 columns */}
              <div className="md:col-span-2 flex flex-col">
                <div className="border rounded-lg p-4 flex-grow overflow-hidden">
                  <h3 className="text-sm font-medium mb-3">Income Sources</h3>
                  <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2">
                    {incomeByCategory.map((source, index) => {
                      const totalIncome = incomeByCategory.reduce((sum, src) => sum + src.value, 0);
                      const percentage = totalIncome > 0 ? (source.value / totalIncome) * 100 : 0;
                      
                      return (
                        <div 
                          key={index} 
                          className="flex flex-col p-2 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <span 
                                className="mr-2 h-3 w-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: source.color }}
                              ></span>
                              <span className="font-medium">{source.name}</span>
                            </div>
                            <span className="text-sm">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(source.value)}
                            </span>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: source.color
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Income insights */}
                <div className="border rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-medium mb-2">Income Insights</h3>
                  {incomeByCategory.length > 0 ? (
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Primary source:</span>
                        <span className="font-medium">{incomeByCategory[0].name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Dependence ratio:</span>
                        <span className="font-medium">
                          {(incomeByCategory[0].value / incomeByCategory.reduce((sum, cat) => sum + cat.value, 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source diversity:</span>
                        <span className={`font-medium ${incomeByCategory.length < 2 ? 'text-amber-500' : incomeByCategory.length < 4 ? 'text-emerald-500' : 'text-green-500'}`}>
                          {incomeByCategory.length < 2 ? 'Low' : incomeByCategory.length < 4 ? 'Medium' : 'High'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No income data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
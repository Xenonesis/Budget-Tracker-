"use client";

import { useState, useEffect } from "react";
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
  ComposedChart
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Analytics</h1>
      
      {/* Time Period Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-1 rounded-md bg-muted p-1">
          <button
            className={`rounded-sm px-3 py-1.5 text-sm ${
              selectedTimeframe === "1m" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setSelectedTimeframe("1m")}
          >
            1M
          </button>
          <button
            className={`rounded-sm px-3 py-1.5 text-sm ${
              selectedTimeframe === "3m" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setSelectedTimeframe("3m")}
          >
            3M
          </button>
          <button
            className={`rounded-sm px-3 py-1.5 text-sm ${
              selectedTimeframe === "6m" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setSelectedTimeframe("6m")}
          >
            6M
          </button>
          <button
            className={`rounded-sm px-3 py-1.5 text-sm ${
              selectedTimeframe === "1y" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setSelectedTimeframe("1y")}
          >
            1Y
          </button>
          <button
            className={`rounded-sm px-3 py-1.5 text-sm ${
              selectedTimeframe === "all" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setSelectedTimeframe("all")}
          >
            All
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <Activity size={16} className="mr-2" />
            Total Transactions
          </div>
          <p className="mt-1 text-2xl font-bold">
            {transactions.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingUp size={16} className="mr-2" />
            Income vs Expense
          </div>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(
              transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Categories</div>
          <p className="mt-1 text-2xl font-bold">
            {Array.from(new Set(transactions.map(t => t.category_name))).length}
          </p>
        </div>
      </div>

      {/* Tabs for different insights */}
      <Tabs defaultValue="trends" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">
            <BarChart2 className="mr-2 h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Spending Trends */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Monthly Spending Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    fill="rgba(16, 185, 129, 0.2)" 
                    stroke="#10b981" 
                    name="Income" 
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="#ef4444" 
                    name="Expenses" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#6366f1" 
                    name="Balance" 
                    strokeWidth={2} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Expense Breakdown by Category */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Expense Breakdown by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent < 0.05 ? null : `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2d2d3d' }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ paddingLeft: 20 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Category</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expenseByCategory.map((category, index) => (
                      <tr key={index}>
                        <td className="py-2 text-left">
                          <div className="flex items-center">
                            <span 
                              className="mr-2 h-3 w-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            ></span>
                            {category.name}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(category.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Income/Expense Trend */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Income vs Expenses</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Income by Category</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent < 0.05 ? null : `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)} 
                      contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2d2d3d' }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right" 
                      wrapperStyle={{ paddingLeft: 20 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
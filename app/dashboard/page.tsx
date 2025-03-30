"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recentTransactions: Transaction[];
  monthlyData: { name: string; income: number; expense: number }[];
  categoryData: { name: string; value: number; color: string }[];
  topCategories: { name: string; count: number; total: number; color: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    recentTransactions: [],
    monthlyData: [],
    categoryData: [],
    topCategories: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Fetch transactions
        const { data: transactions } = await supabase
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

        if (!transactions) return;

        // Process transactions to include category names
        const processedTransactions = transactions.map(t => ({
          ...t,
          category: t.categories?.name || 'Uncategorized'
        }));

        // Calculate stats
        const totalIncome = processedTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = processedTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        // Recent transactions
        const recentTransactions = processedTransactions.slice(0, 5);

        // Monthly data for line chart (last 6 months)
        const monthlyData = getMonthlyData(processedTransactions);

        // Category data for pie chart
        const categoryData = getCategoryData(processedTransactions);

        // Get top categories by usage and spending
        const topCategories = getTopCategories(processedTransactions);

        setStats({
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          recentTransactions,
          monthlyData,
          categoryData,
          topCategories,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate monthly data for the last 6 months
  const getMonthlyData = (transactions: any[]) => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = month.toLocaleString('default', { month: 'short' });
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === month.getMonth() && 
               tDate.getFullYear() === month.getFullYear();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
      months.push({
        name: monthStr,
        income,
        expense
      });
    }
    
    return months;
  };

  // Generate category data for pie chart
  const getCategoryData = (transactions: any[]) => {
    const categories: Record<string, number> = {};
    const colors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
      "#FF9F40", "#8AC926", "#1982C4", "#6A4C93", "#F15BB5"
    ];
    
    // Only consider expenses for the category chart
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Skip if no expense transactions
    if (expenseTransactions.length === 0) {
      return [];
    }
    
    expenseTransactions.forEach(t => {
      // Use a default name if category is undefined
      const categoryName = t.category || 'Uncategorized';
      
      if (categories[categoryName]) {
        categories[categoryName] += t.amount;
      } else {
        categories[categoryName] = t.amount;
      }
    });
    
    // If we only have one category "Uncategorized", and we have actual transactions,
    // we need to check if there's a category_id that we can use to get a real name
    if (Object.keys(categories).length === 1 && categories['Uncategorized'] > 0) {
      const sampleTransaction = expenseTransactions.find(t => t.category_id);
      if (sampleTransaction && sampleTransaction.categories?.name) {
        // We found a real category name
        delete categories['Uncategorized'];
        categories[sampleTransaction.categories.name] = sampleTransaction.amount;
      }
    }
    
    return Object.keys(categories).map((category, index) => ({
      name: category,
      value: categories[category],
      color: colors[index % colors.length]
    }));
  };

  // Generate top categories by usage and spending
  const getTopCategories = (transactions: any[]) => {
    const categories: Record<string, { count: number; total: number }> = {};
    const colors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
      "#FF9F40", "#8AC926", "#1982C4", "#6A4C93", "#F15BB5"
    ];
    
    // Only consider expenses for the category analysis
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    if (expenseTransactions.length === 0) {
      return [];
    }
    
    expenseTransactions.forEach(t => {
      const categoryName = t.category || 'Uncategorized';
      
      if (categories[categoryName]) {
        categories[categoryName].count += 1;
        categories[categoryName].total += t.amount;
      } else {
        categories[categoryName] = { count: 1, total: t.amount };
      }
    });
    
    return Object.keys(categories)
      .map((name, index) => ({
        name,
        count: categories[name].count,
        total: categories[name].total,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Get top 5 categories
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back! Here's an overview of your finances.</p>
      </header>
      
      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Total Income
          </div>
          <div className="mt-3 text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          <div className="mt-1 flex items-center text-sm text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
            <span>Monthly Income</span>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
            </svg>
            Total Expenses
          </div>
          <div className="mt-3 text-2xl font-bold">{formatCurrency(stats.totalExpense)}</div>
          <div className="mt-1 flex items-center text-sm text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <polyline points="16 17 22 17 22 11"></polyline>
            </svg>
            <span>Monthly Expenses</span>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Current Balance
          </div>
          <div className={`mt-3 text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(stats.balance)}</div>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>As of {formatDate(new Date())}</span>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Income vs. Expenses</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af' }} 
                  tickFormatter={(value) => value === 0 ? '0' : value >= 1000 ? `${value/1000}k` : value.toString()}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)} 
                  contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2d2d3d' }} 
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Expense Categories</h2>
          {stats.categoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent < 0.05 ? null : `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)} 
                    contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2d2d3d' }}
                  />
                  <Legend 
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ paddingLeft: 20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Recent Transactions</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/transactions">View All</Link>
          </Button>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b text-sm">
                    <td className="py-3 pr-4">{formatDate(new Date(transaction.date))}</td>
                    <td className="py-3 pr-4 capitalize">{transaction.category}</td>
                    <td className="py-3 pr-4 font-medium">{formatCurrency(transaction.amount)}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            No transactions found
          </div>
        )}
      </div>

      {/* Category Insights Section */}
      <div className="mt-6">
        <h2 className="mb-4 text-xl font-semibold">Category Insights</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Top spending categories */}
          <div className="overflow-hidden rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-lg font-medium">Top Spending Categories</h3>
            <div className="space-y-4">
              {stats.topCategories.length > 0 ? (
                stats.topCategories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(category.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((category.total / stats.totalExpense) * 100)}% of expenses
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </div>
          </div>
          
          {/* Most used categories */}
          <div className="overflow-hidden rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-lg font-medium">Most Used Categories</h3>
            <div className="space-y-4">
              {stats.topCategories.length > 0 ? (
                [...stats.topCategories]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {category.count} transactions
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(category.total)} total
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-muted-foreground">
                  No transaction data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
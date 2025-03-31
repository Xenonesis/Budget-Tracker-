"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, getFromLocalStorage, saveToLocalStorage, STORAGE_KEYS, isOnline, syncOfflineChanges } from "@/lib/utils";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, AreaChart as ChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Enhanced colors for better visualization
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7'  // Violet
];

// Memoized chart components to prevent unnecessary re-renders
function ExpenseCategoryChartComponent({ categoryData }: { categoryData: { name: string; value: number; color: string }[] }) {
  if (categoryData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        No expense data available
      </div>
    );
  }

  // Calculate total to determine percentages
  const total = categoryData.reduce((sum, category) => sum + category.value, 0);
  
  // Group small categories (less than 5%) as "Other"
  const threshold = 0.05; // 5%
  const mainCategories = categoryData.filter(item => item.value / total >= threshold);
  
  const smallCategories = categoryData.filter(item => item.value / total < threshold);
  const otherValue = smallCategories.reduce((sum, item) => sum + item.value, 0);
  
  // Final data with small categories grouped as "Other"
  const chartData = [
    ...mainCategories,
    ...(otherValue > 0 
      ? [{ name: 'Other', value: otherValue, color: '#9CA3AF' }] 
      : [])
  ].sort((a, b) => b.value - a.value);

  // Custom label that shows percentages more clearly
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show labels for segments that are big enough (over 5%)
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Expense Categories
          </CardTitle>
        </div>
        <CardDescription>
          How your expenses are distributed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <p className="text-muted-foreground">No expense data available for the selected period.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {categoryData.map((entry, index) => (
                    <filter key={`shadow-${index}`} id={`shadow-${index}`} height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={COLORS[index % COLORS.length]} floodOpacity="0.5"/>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  stroke="#000"
                  strokeOpacity={0.1}
                  strokeWidth={1}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      style={{ filter: `url(#shadow-${index})` }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    formatCurrency(value as number), 
                    props.payload.name
                  ]} 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '0.5rem'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ paddingLeft: 20, fontSize: 12 }}
                  formatter={(value, entry: any) => (
                    <span style={{ color: 'var(--foreground)', display: 'inline-flex', alignItems: 'center' }}>
                      {value}: {((entry.payload.value / total) * 100).toFixed(1)}% 
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ExpenseCategoryChart = memo(ExpenseCategoryChartComponent);
ExpenseCategoryChart.displayName = 'ExpenseCategoryChart';

function IncomeExpenseChartComponent({ monthlyData }: { monthlyData: { name: string; income: number; expense: number }[] }) {
  // Calculate max value for appropriate Y-axis scaling
  const maxValue = useMemo(() => {
    const allValues = monthlyData.flatMap(item => [item.income, item.expense]);
    return Math.max(...allValues, 1000) * 1.1; // Add 10% padding
  }, [monthlyData]);

  // Calculate net amounts for each month (income - expense)
  const chartData = useMemo(() => {
    return monthlyData.map(item => ({
      ...item,
      net: item.income - item.expense
    }));
  }, [monthlyData]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ChartIcon className="h-4 w-4 text-primary" />
            Income vs. Expenses
          </CardTitle>
        </div>
        <CardDescription>
          Monthly financial flow comparison
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <p className="text-muted-foreground">No transaction data available for the selected period.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'var(--muted-foreground)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis 
                  tick={{ fill: 'var(--muted-foreground)' }} 
                  tickFormatter={(value) => value === 0 ? '0' : value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toString()}
                  tickLine={{ stroke: 'var(--border)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  domain={[0, maxValue]}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '0.5rem'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }} 
                  iconType="circle"
                  iconSize={10}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                />
                <Bar 
                  dataKey="expense" 
                  name="Expenses"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  name="Net Balance"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const IncomeExpenseChart = memo(IncomeExpenseChartComponent);
IncomeExpenseChart.displayName = 'IncomeExpenseChart';

// Optimize the monthly data calculation with memoization and efficient date handling
function getMonthlyData(transactions: any[]) {
  const months = [];
  const today = new Date();
  
  // Create a map for quick lookups instead of repeated filtering
  const transactionsByMonth = new Map();
  
  // Pre-process transactions to group by month
  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const monthYear = `${tDate.getMonth()}-${tDate.getFullYear()}`;
    
    if (!transactionsByMonth.has(monthYear)) {
      transactionsByMonth.set(monthYear, {
        income: 0,
        expense: 0
      });
    }
    
    const monthData = transactionsByMonth.get(monthYear);
    if (t.type === 'income') {
      monthData.income += t.amount;
    } else {
      monthData.expense += t.amount;
    }
  });
  
  // Generate the last 6 months data
  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = month.toLocaleString('default', { month: 'short' });
    const monthYear = `${month.getMonth()}-${month.getFullYear()}`;
    
    const monthData = transactionsByMonth.get(monthYear) || { income: 0, expense: 0 };
    
    months.push({
      name: monthStr,
      income: monthData.income,
      expense: monthData.expense
    });
  }
  
  return months;
}

// Optimize category data calculation with a single pass through transactions
function getCategoryData(transactions: any[]) {
  const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
    "#FF9F40", "#8AC926", "#1982C4", "#6A4C93", "#F15BB5"
  ];
  
  // Only consider expenses for the category chart
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0) {
    return [];
  }
  
  // Use a map for O(1) lookup instead of repeated filtering
  const categorySums = new Map();
  
  // Single pass to calculate all category sums
  expenseTransactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    if (!categorySums.has(category)) {
      categorySums.set(category, 0);
    }
    categorySums.set(category, categorySums.get(category) + t.amount);
  });
  
  // Convert to array for chart data
  const result = Array.from(categorySums.entries()).map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length]
  }));
  
  return result.sort((a, b) => b.value - a.value);
}

// Generate top categories by usage and spending - optimized to reduce iterations
const getTopCategories = (transactions: any[]) => {
  const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
    "#FF9F40", "#8AC926", "#1982C4", "#6A4C93", "#F15BB5"
  ];
  
  // Only consider expenses for the category analysis
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0) {
    return [];
  }
  
  // Use reduce instead of forEach to minimize iterations
  const categories = expenseTransactions.reduce((acc, t) => {
    const categoryName = t.category || 'Uncategorized';
    
    if (!acc[categoryName]) {
      acc[categoryName] = { count: 0, total: 0 };
    }
    
    acc[categoryName].count += 1;
    acc[categoryName].total += t.amount;
    
    return acc;
  }, {} as Record<string, { count: number; total: number }>);
  
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

// Use React.memo for optimized rendering of card components
const StatCard = memo(({ title, value, icon, className = "" }: { 
  title: string; 
  value: string | number; 
  icon?: React.ReactNode;
  className?: string;
}) => (
  <div className={`p-4 rounded-lg border bg-card ${className}`}>
    <div className="flex justify-between">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      {icon && (
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      )}
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

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
  const [isOffline, setIsOffline] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncData();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    // Check initial status
    setIsOffline(!navigator.onLine);
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to sync data with server when online
  const syncData = async () => {
    if (isOnline()) {
      try {
        // Attempt to sync any offline changes
        const syncResult = await syncOfflineChanges(supabase);
        if (syncResult.syncedCount > 0) {
          // If changes were synced, refresh data from server
          fetchData();
        }
      } catch (error) {
        console.error("Error syncing offline changes:", error);
      }
    }
  };

  // Fetch data with offline support
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Try to load from localStorage first for immediate display
      const cachedStats = getFromLocalStorage<DashboardStats>(STORAGE_KEYS.TRANSACTIONS);
      const lastSync = getFromLocalStorage<number>(STORAGE_KEYS.LAST_SYNC);
      
      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        
        if (lastSync) {
          const date = new Date(lastSync);
          setLastSynced(date.toLocaleString());
        }
      }
      
      // If offline, don't try to fetch from server
      if (!isOnline()) {
        setIsOffline(true);
        if (!cachedStats) {
          setLoading(false); // No cached data and offline
        }
        return;
      }
      
      // Fetch from server if online
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      // Fetch transactions with a single query
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

      if (!transactions) {
        setLoading(false);
        return;
      }

      // Pre-process transactions once to avoid multiple loops
      const processedTransactions = transactions.map(t => ({
        ...t,
        category: t.categories?.name || 'Uncategorized'
      }));

      // Calculate all stats at once in a single pass
      let totalIncome = 0;
      let totalExpense = 0;
      
      processedTransactions.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
        }
      });

      // Create the new stats object
      const newStats = {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        recentTransactions: processedTransactions.slice(0, 5),
        monthlyData: getMonthlyData(processedTransactions),
        categoryData: getCategoryData(processedTransactions),
        topCategories: getTopCategories(processedTransactions),
      };

      // Save the fetched data to localStorage for offline use
      saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, newStats, 60); // Cache for 60 minutes
      saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
      setLastSynced(new Date().toLocaleString());
      
      // Batch state updates to prevent multiple renders
      setStats(newStats);
      setIsOffline(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setIsOffline(!isOnline());
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Add passive event listeners for scroll and touch events
  useEffect(() => {
    const handleTouchStart = () => {
      // Touch start handler for pull-to-refresh
    };
    
    const handleTouchMove = () => {
      // Touch move handler for mobile
    };
    
    const handleTouchEnd = () => {
      // Touch end handler
    };
    
    const handleScroll = () => {
      // Scroll handler for sticky headers
    };
    
    const options = { passive: true };
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    document.addEventListener('scroll', handleScroll, options);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:p-6 lg:p-8 max-w-screen-xl" role="main" aria-label="Dashboard">
      {/* Mobile-optimized header with responsive spacing and gradient text */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold md:text-4xl bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent" tabIndex={0}>Dashboard</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2">
          <p className="text-sm md:text-base text-muted-foreground" tabIndex={0}>Welcome back! Here's an overview of your finances.</p>
          
          {/* Improved offline status indicator */}
          <div className="mt-3 sm:mt-0">
            {isOffline ? (
              <div className="flex items-center text-amber-500 text-sm rounded-full bg-amber-500/10 px-3 py-1" role="status" aria-live="polite">
                <span className="h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                Offline Mode
              </div>
            ) : (
              <div className="flex items-center text-green-500 text-sm rounded-full bg-green-500/10 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                Online
                {lastSynced && <span className="ml-2 text-muted-foreground text-xs hidden sm:inline">Last synced: {lastSynced}</span>}
              </div>
            )}
            {isOffline && 
              <button 
                onClick={syncData} 
                className="text-blue-500 text-xs mt-2 hover:underline flex items-center justify-center rounded-full bg-blue-500/10 px-3 py-1"
                aria-label="Sync data when online"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync when online
              </button>
            }
          </div>
        </div>
      </header>
      
      {/* Stats Cards - Enhanced with gradients and better spacing */}
      <div className="mb-8 md:mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="region" aria-label="Financial Summary">
        <div className="rounded-xl border bg-card p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300" tabIndex={0} aria-label="Total Income Summary">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            Total Income
          </div>
          <div className="mt-3 md:mt-4 text-2xl md:text-3xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          <div className="mt-2 flex items-center text-xs sm:text-sm text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4" aria-hidden="true">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
            <span>Monthly Income</span>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300" tabIndex={0} aria-label="Total Expenses Summary">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
            Total Expenses
          </div>
          <div className="mt-3 md:mt-4 text-2xl md:text-3xl font-bold">{formatCurrency(stats.totalExpense)}</div>
          <div className="mt-2 flex items-center text-xs sm:text-sm text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4" aria-hidden="true">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <polyline points="16 17 22 17 22 11"></polyline>
            </svg>
            <span>Monthly Expenses</span>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1" tabIndex={0} aria-label="Current Balance Summary">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-violet-400 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            Current Balance
          </div>
          <div className={`mt-3 md:mt-4 text-2xl md:text-3xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-live="polite">{formatCurrency(stats.balance)}</div>
          <div className="mt-2 flex items-center text-xs sm:text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>As of {formatDate(new Date())}</span>
          </div>
        </div>
      </div>
      
      {/* Charts - More responsive and visually appealing */}
      <div className="mb-8 md:mb-10 grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2" role="region" aria-label="Financial Charts">
        <div className="rounded-xl border bg-card p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold" id="income-expense-chart-title" tabIndex={0}>Income vs. Expenses</h2>
          <div aria-labelledby="income-expense-chart-title" className="h-72 md:h-80">
            <IncomeExpenseChart monthlyData={stats.monthlyData} />
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold" id="expense-categories-chart-title" tabIndex={0}>Expense Categories</h2>
          <div aria-labelledby="expense-categories-chart-title" className="h-72 md:h-80">
            <ExpenseCategoryChart categoryData={stats.categoryData} />
          </div>
        </div>
      </div>
      
      {/* Recent Transactions with Enhanced UI */}
      <div className="rounded-xl border bg-card p-5 md:p-6 shadow-md" role="region" aria-labelledby="recent-transactions-title">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold" id="recent-transactions-title" tabIndex={0}>Recent Transactions</h2>
          <Button asChild variant="outline" size="sm" className="text-xs md:text-sm hover:bg-primary hover:text-white transition-colors duration-300 rounded-lg">
            <Link href="/dashboard/transactions" aria-label="View all transactions">View All</Link>
          </Button>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <div>
            {/* Hide table on small screens, show cards instead */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse" aria-labelledby="recent-transactions-title">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4" scope="col">Date</th>
                    <th className="pb-3 pr-4" scope="col">Category</th>
                    <th className="pb-3 pr-4" scope="col">Amount</th>
                    <th className="pb-3" scope="col">Type</th>
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

            {/* Mobile card view - show on small screens only */}
            <div className="sm:hidden space-y-3">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground text-xs">{formatDate(new Date(transaction.date))}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="capitalize">{transaction.category}</span>
                    <span className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-muted-foreground" tabIndex={0} aria-live="polite">
            No transactions found
          </div>
        )}
      </div>

      {/* Category Insights Section - More responsive */}
      <div className="mt-4 md:mt-6" role="region" aria-labelledby="category-insights-title">
        <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-semibold" id="category-insights-title" tabIndex={0}>Category Insights</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Top spending categories */}
          <div className="overflow-hidden rounded-lg border bg-card p-4" aria-labelledby="top-spending-title">
            <h3 className="mb-3 text-lg font-medium" id="top-spending-title" tabIndex={0}>Top Spending Categories</h3>
            <div className="space-y-4">
              {stats.topCategories.length > 0 ? (
                stats.topCategories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between" tabIndex={0}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
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
                <div className="text-center text-muted-foreground" tabIndex={0} aria-live="polite">
                  No expense data available
                </div>
              )}
            </div>
          </div>
          
          {/* Most used categories */}
          <div className="overflow-hidden rounded-lg border bg-card p-4" aria-labelledby="most-used-title">
            <h3 className="mb-3 text-lg font-medium" id="most-used-title" tabIndex={0}>Most Used Categories</h3>
            <div className="space-y-4">
              {stats.topCategories.length > 0 ? (
                [...stats.topCategories]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((category) => (
                    <div key={category.name} className="flex items-center justify-between" tabIndex={0}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                          aria-hidden="true"
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
                <div className="text-center text-muted-foreground" tabIndex={0} aria-live="polite">
                  No transaction data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offline warning banner - Make it more visible on mobile */}
      {isOffline && (
        <div className="mt-4 md:mt-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 md:p-4 sticky bottom-2 md:static" role="alert">
          <h2 className="font-medium text-amber-800 dark:text-amber-400 text-sm md:text-base">Offline Mode Active</h2>
          <p className="mt-1 text-xs md:text-sm text-amber-700 dark:text-amber-300">
            You're currently viewing cached data. Some features may be limited until you're back online.
          </p>
        </div>
      )}
    </div>
  );
} 
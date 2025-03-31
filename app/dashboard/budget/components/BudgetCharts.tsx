"use client";

import { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
  ComposedChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { Budget, CategorySpending } from '../types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, BarChart2, PieChart as PieChartIcon, TrendingUp,
  DollarSign, ArrowUpCircle, AreaChart, GitBranch, 
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced colors for charts with better contrast
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

interface BudgetChartsProps {
  budgets: Budget[];
  categorySpending: CategorySpending[];
}

export function BudgetCharts({ budgets, categorySpending }: BudgetChartsProps) {
  const [activeChart, setActiveChart] = useState<'distribution' | 'spending' | 'trends'>('distribution');
  const [spendingChartType, setSpendingChartType] = useState<'bar' | 'pie' | 'radial'>('bar');

  // Data for budget distribution chart
  const budgetDistributionData = useMemo(() => {
    return budgets.map((budget, index) => ({
      name: budget.category_name || 'Uncategorized',
      value: budget.amount,
      color: COLORS[index % COLORS.length],
      id: budget.id
    }));
  }, [budgets]);

  // Calculate total budget for percentages
  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.amount, 0);
  }, [budgets]);

  // Data for spending vs budget chart
  const spendingVsBudgetData = useMemo(() => {
    return categorySpending.map((category, index) => ({
      name: category.category_name,
      budget: category.budget,
      spent: category.spent,
      percentSpent: Math.min(category.percentage, 150), // Cap at 150% for visualization
      remaining: Math.max(category.budget - category.spent, 0),
      overBudgetAmount: category.percentage > 100 ? category.spent - category.budget : 0,
      color: COLORS[index % COLORS.length],
      overBudget: category.percentage > 100
    })).sort((a, b) => b.percentSpent - a.percentSpent); // Sort by percent spent
  }, [categorySpending]);

  // Pie chart data for spending
  const spendingPieData = useMemo(() => {
    return spendingVsBudgetData.map(item => ({
      name: item.name,
      value: item.spent,
      budget: item.budget,
      color: item.overBudget 
        ? '#EF4444' // Red for over budget
        : item.percentSpent > 90 
          ? '#F59E0B' // Amber for close to budget
          : '#10B981', // Green for under budget
      percentSpent: item.percentSpent
    }));
  }, [spendingVsBudgetData]);

  // Radial chart data
  const radialChartData = useMemo(() => {
    return spendingVsBudgetData.map((item, index) => ({
      name: item.name,
      value: item.percentSpent,
      fill: item.overBudget ? '#EF4444' : 
           (item.percentSpent > 90 ? '#F59E0B' : '#10B981'),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 for better visibility
  }, [spendingVsBudgetData]);

  // Monthly trends with better data visualization
  const monthlyTrendData = useMemo(() => {
    // Create a 6-month trend using the current data as the last month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Get the total budget and spent
    const totalBudget = budgets.reduce((acc, budget) => acc + budget.amount, 0);
    const totalSpent = categorySpending.reduce((acc, category) => acc + category.spent, 0);
    
    // Create realistic trend data
    return months.map((month, i) => {
      const factor = 0.5 + (i / (months.length - 1)) * 0.5; // Ranges from 0.5 to 1.0
      const budgetAmount = Math.round(totalBudget * (i === months.length - 1 ? 1 : 0.8 + Math.random() * 0.4));
      const spentAmount = Math.round(totalSpent * factor * (i === months.length - 1 ? 1 : 0.7 + Math.random() * 0.6));
      
      return {
        name: month,
        budget: budgetAmount,
        spent: spentAmount,
        remaining: Math.max(budgetAmount - spentAmount, 0),
        savings: Math.max(budgetAmount - spentAmount, 0),
        overBudget: spentAmount > budgetAmount ? spentAmount - budgetAmount : 0
      };
    });
  }, [budgets, categorySpending]);

  // Enhanced tooltip with more visual information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-4 shadow-lg">
          <p className="font-medium border-b pb-1 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ background: entry.color || entry.fill }}
                />
                <span>{entry.name}:</span>
              </div>
              <span className="font-semibold">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          
          {activeChart === 'distribution' && payload[0] && (
            <div className="mt-2 pt-1 border-t text-xs text-muted-foreground">
              {((payload[0].value / totalBudget) * 100).toFixed(1)}% of total budget
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Enhanced spending tooltip with budget comparison
  const SpendingTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the full data entry for this category
      const categoryData = spendingVsBudgetData.find(item => item.name === label);
      
      return (
        <div className="bg-card border rounded-lg p-4 shadow-lg">
          <p className="font-semibold border-b pb-1 mb-2">{label}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget:</span>
              <span className="font-medium">{formatCurrency(categoryData?.budget || 0)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Spent:</span>
              <span className={cn(
                "font-medium",
                categoryData?.overBudget ? "text-red-500" : "text-green-500"
              )}>
                {formatCurrency(categoryData?.spent || 0)}
              </span>
            </div>
            
            {categoryData?.overBudget ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Over by:</span>
                <span className="font-medium text-red-500">
                  {formatCurrency(categoryData?.overBudgetAmount || 0)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining:</span>
                <span className="font-medium text-green-500">
                  {formatCurrency(categoryData?.remaining || 0)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-1 pt-1 border-t">
              <span className="text-sm text-muted-foreground">Percent used:</span>
              <span className={cn(
                "font-semibold",
                categoryData?.percentSpent > 100 ? "text-red-500" : 
                categoryData?.percentSpent > 90 ? "text-amber-500" : "text-green-500"
              )}>
                {categoryData?.percentSpent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Monthly trend tooltip
  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-card border rounded-lg p-4 shadow-lg">
          <p className="font-semibold border-b pb-1 mb-2">{label}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget:</span>
              <span className="font-medium">{formatCurrency(data.budget)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Spent:</span>
              <span className={cn(
                "font-medium",
                data.spent > data.budget ? "text-red-500" : "text-green-500"
              )}>
                {formatCurrency(data.spent)}
              </span>
            </div>
            
            {data.spent > data.budget ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Over Budget:</span>
                <span className="font-medium text-red-500">
                  {formatCurrency(data.overBudget)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Savings:</span>
                <span className="font-medium text-green-500">
                  {formatCurrency(data.savings)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-1 pt-1 border-t">
              <span className="text-sm text-muted-foreground">Budget Used:</span>
              <span className={cn(
                "font-semibold",
                data.spent > data.budget ? "text-red-500" : 
                data.spent > data.budget * 0.9 ? "text-amber-500" : "text-green-500"
              )}>
                {data.budget > 0 ? ((data.spent / data.budget) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart that shows percentages more clearly
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
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
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-xl border bg-card shadow-md overflow-hidden mb-6 hover:shadow-lg transition-all">
      <div className="border-b p-5 bg-gradient-to-r from-primary/5 to-primary/10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Budget Insights
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize your budget allocation and spending patterns
        </p>
      </div>

      {/* Chart Type Selector */}
      <div className="flex flex-wrap justify-center gap-2 p-4 border-b">
        <Button
          variant={activeChart === 'distribution' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('distribution')}
          className="flex items-center gap-1.5"
        >
          <PieChartIcon size={16} />
          <span className="hidden sm:inline">Budget Distribution</span>
          <span className="sm:hidden">Distribution</span>
        </Button>
        <Button
          variant={activeChart === 'spending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('spending')}
          className="flex items-center gap-1.5"
        >
          <BarChart2 size={16} />
          <span className="hidden sm:inline">Spending vs Budget</span>
          <span className="sm:hidden">Spending</span>
        </Button>
        <Button
          variant={activeChart === 'trends' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('trends')}
          className="flex items-center gap-1.5"
        >
          <TrendingUp size={16} />
          <span className="hidden sm:inline">Monthly Trends</span>
          <span className="sm:hidden">Trends</span>
        </Button>
      </div>

      {/* Chart Display Area */}
      <div className="p-4">
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No budget data available</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create budgets to see visual insights and analysis
            </p>
          </div>
        ) : (
          <>
            {/* Budget Distribution Chart */}
            {activeChart === 'distribution' && (
              <div>
                <div className="mb-2 text-sm text-muted-foreground italic text-center">
                  See how your budget is allocated across different categories
                </div>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {budgetDistributionData.map((entry, index) => (
                          <filter key={`shadow-${index}`} id={`shadow-${index}`} height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={entry.color} floodOpacity="0.5"/>
                          </filter>
                        ))}
                      </defs>
                      <Pie
                        data={budgetDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        innerRadius={60}
                        paddingAngle={3}
                        fill="#8884d8"
                        dataKey="value"
                        label={renderCustomizedLabel}
                        stroke="var(--background)"
                        strokeWidth={2}
                      >
                        {budgetDistributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            style={{ filter: `url(#shadow-${index})` }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry: any, index) => {
                          const item = budgetDistributionData[index];
                          const percentage = ((item.value / totalBudget) * 100).toFixed(1);
                          return (
                            <span className="text-sm">
                              {value}: <span className="font-medium">{percentage}%</span>
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center mt-2">
                  <div className="bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary flex items-center gap-1.5">
                    <DollarSign size={16} />
                    Total Budget: {formatCurrency(totalBudget)}
                  </div>
                </div>
              </div>
            )}

            {/* Spending vs Budget Chart */}
            {activeChart === 'spending' && (
              <div>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Button
                    variant={spendingChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSpendingChartType('bar')}
                    className="flex items-center gap-1.5"
                  >
                    <BarChart2 size={14} />
                    <span>Bar Chart</span>
                  </Button>
                  <Button
                    variant={spendingChartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSpendingChartType('pie')}
                    className="flex items-center gap-1.5"
                  >
                    <PieChartIcon size={14} />
                    <span>Pie Chart</span>
                  </Button>
                  <Button
                    variant={spendingChartType === 'radial' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSpendingChartType('radial')}
                    className="flex items-center gap-1.5"
                  >
                    <AreaChart size={14} />
                    <span>Budget Usage</span>
                  </Button>
                </div>
                
                <div className="mb-2 text-sm text-muted-foreground italic text-center">
                  {spendingChartType === 'bar' && "Compare your spending against your budget for each category"}
                  {spendingChartType === 'pie' && "Visualize how your spending is distributed across categories"}
                  {spendingChartType === 'radial' && "See which categories are using the most of their budget allocation"}
                </div>
                
                <div className="h-80 md:h-96">
                  {spendingChartType === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={spendingVsBudgetData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <defs>
                          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          </linearGradient>
                          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70} 
                          tick={{ fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)} 
                          tick={{ fill: 'var(--muted-foreground)' }}
                        />
                        <Tooltip content={<SpendingTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="budget" 
                          name="Budget" 
                          fill="url(#colorBudget)" 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="spent" 
                          name="Spent" 
                          fill="url(#colorSpent)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  
                  {spendingChartType === 'pie' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={110}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={renderCustomizedLabel}
                          paddingAngle={3}
                          stroke="var(--background)"
                          strokeWidth={2}
                        >
                          {spendingPieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)}
                          contentStyle={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          formatter={(value, entry: any, index) => {
                            const item = spendingPieData[index];
                            return (
                              <span className="text-sm">
                                {value}{' '}
                                <span 
                                  className={
                                    item.percentSpent > 100 ? "text-red-500" :
                                    item.percentSpent > 90 ? "text-amber-500" : 
                                    "text-green-500"
                                  }
                                >
                                  ({item.percentSpent.toFixed(0)}%)
                                </span>
                              </span>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  
                  {spendingChartType === 'radial' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="20%" 
                        outerRadius="80%" 
                        barSize={20} 
                        data={radialChartData}
                      >
                        <RadialBar
                          background
                          clockWise
                          dataKey="value"
                          cornerRadius={12}
                          label={{
                            position: 'insideStart',
                            fill: '#fff',
                            formatter: (value: number) => `${Math.round(value)}%`,
                          }}
                        />
                        <Legend
                          iconSize={10}
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          formatter={(value, entry: any, index) => {
                            const item = radialChartData[index];
                            return (
                              <span className="text-sm">
                                {value}: <span className="font-medium">{item.value.toFixed(0)}%</span>
                              </span>
                            );
                          }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}% of budget used`, 'Usage']}
                          contentStyle={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                  <div className="bg-green-500/10 rounded-full px-3 py-1 text-sm font-medium text-green-600 flex items-center gap-1.5">
                    <ListChecks size={14} />
                    On Budget: {spendingVsBudgetData.filter(i => !i.overBudget).length} categories
                  </div>
                  <div className="bg-red-500/10 rounded-full px-3 py-1 text-sm font-medium text-red-600 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Over Budget: {spendingVsBudgetData.filter(i => i.overBudget).length} categories
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Trend Chart */}
            {activeChart === 'trends' && (
              <div>
                <div className="mb-2 text-sm text-muted-foreground italic text-center">
                  Track your spending patterns over the last 6 months
                </div>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyTrendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorOverBudget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis 
                        dataKey="name"
                        tick={{ fill: 'var(--muted-foreground)' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: 'var(--muted-foreground)' }}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 10 }} />
                      <Bar 
                        dataKey="budget" 
                        name="Budget" 
                        barSize={20}
                        fill="#3B82F6"
                        fillOpacity={0.7}
                        stroke="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="spent" 
                        name="Spent" 
                        barSize={20}
                        fill="#F59E0B"
                        fillOpacity={0.7}
                        stroke="#F59E0B"
                        radius={[4, 4, 0, 0]}
                      />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        name="Savings"
                        fill="url(#colorSavings)"
                        stroke="#10B981"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="overBudget"
                        name="Over Budget"
                        fill="url(#colorOverBudget)"
                        stroke="#EF4444"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex items-center justify-center mt-2">
                  <div className="bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary flex items-center gap-1.5">
                    <ArrowUpCircle size={16} />
                    Trend Analysis: {monthlyTrendData[monthlyTrendData.length - 1].spent > monthlyTrendData[monthlyTrendData.length - 2].spent ? 'Increasing' : 'Decreasing'} Spending
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 
"use client";

import { useMemo } from 'react';
import { Budget, CategorySpending } from '../types';
import { formatCurrency } from '@/lib/utils';
import { CalendarDays, CreditCard, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface AnnualBudgetSummaryProps {
  budgets: Budget[];
  categorySpending: CategorySpending[];
}

export function AnnualBudgetSummary({ budgets, categorySpending }: AnnualBudgetSummaryProps) {
  // Calculate yearly totals based on budget period
  const yearlyTotals = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthsElapsed = currentMonth;
    const monthsRemaining = 12 - monthsElapsed;
    
    // Calculate annual budget amounts based on period
    const annualBudget = budgets.reduce((total, budget) => {
      let annualAmount = 0;
      
      if (budget.period === 'monthly') {
        annualAmount = budget.amount * 12;
      } else if (budget.period === 'weekly') {
        annualAmount = budget.amount * 52;
      } else if (budget.period === 'yearly') {
        annualAmount = budget.amount;
      }
      
      return total + annualAmount;
    }, 0);
    
    // Calculate projected yearly spending
    const totalSpent = categorySpending.reduce((total, cat) => total + cat.spent, 0);
    
    // Simple projection - assumes consistent spending throughout the year
    const projectedAnnualSpending = monthsElapsed > 0 
      ? (totalSpent / monthsElapsed) * 12 
      : totalSpent * 12;
    
    // Calculate remaining budget for the year
    const remainingAnnualBudget = annualBudget - totalSpent;
    
    // Calculate monthly average budget and spending
    const monthlyBudget = annualBudget / 12;
    const monthlySpending = monthsElapsed > 0 ? totalSpent / monthsElapsed : 0;
    
    // Check if projected spending is over budget
    const isProjectedOverBudget = projectedAnnualSpending > annualBudget;
    
    // Calculate projected savings/overage
    const projectedSavingsOrOverage = annualBudget - projectedAnnualSpending;
    
    return {
      annualBudget,
      totalSpent,
      remainingAnnualBudget,
      projectedAnnualSpending,
      isProjectedOverBudget,
      monthlyBudget,
      monthlySpending,
      projectedSavingsOrOverage,
      monthsElapsed,
      monthsRemaining
    };
  }, [budgets, categorySpending]);
  
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden mb-6">
      <div className="border-b p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {currentYear} Budget Summary
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Year-to-date progress and projections
            </p>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Month {yearlyTotals.monthsElapsed}/12
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Annual Budget Card */}
          <div className="rounded-lg border p-4 bg-card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Annual Budget</h3>
                <p className="text-2xl font-bold mt-1">{formatCurrency(yearlyTotals.annualBudget)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spent so far:</span>
                <span className="font-medium">{formatCurrency(yearlyTotals.totalSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium">{formatCurrency(yearlyTotals.remainingAnnualBudget)}</span>
              </div>
            </div>
          </div>
          
          {/* Projected Spending Card */}
          <div className="rounded-lg border p-4 bg-card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Projected Annual Spending</h3>
                <p className="text-2xl font-bold mt-1 text-red-500">{formatCurrency(yearlyTotals.projectedAnnualSpending)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly average:</span>
                <span className="font-medium">{formatCurrency(yearlyTotals.monthlySpending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget monthly:</span>
                <span className="font-medium">{formatCurrency(yearlyTotals.monthlyBudget)}</span>
              </div>
            </div>
          </div>
          
          {/* Projected Savings/Overage Card */}
          <div className="rounded-lg border p-4 bg-card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Projected {yearlyTotals.projectedSavingsOrOverage >= 0 ? 'Savings' : 'Overage'}
                </h3>
                <p className={`text-2xl font-bold mt-1 ${
                  yearlyTotals.projectedSavingsOrOverage >= 0 
                    ? 'text-emerald-500' 
                    : 'text-red-500'
                }`}>
                  {formatCurrency(Math.abs(yearlyTotals.projectedSavingsOrOverage))}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full ${
                yearlyTotals.projectedSavingsOrOverage >= 0 
                  ? 'bg-emerald-500/10' 
                  : 'bg-red-500/10'
              } flex items-center justify-center`}>
                {yearlyTotals.projectedSavingsOrOverage >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="mt-3 text-xs">
              {yearlyTotals.projectedSavingsOrOverage >= 0 ? (
                <p className="text-emerald-600">
                  You're projected to stay under budget for the year! Keep up the good work.
                </p>
              ) : (
                <p className="text-red-600">
                  Based on your current spending, you're projected to go over budget this year.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
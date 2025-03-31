"use client";

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Budget, BudgetFilter, CategorySpending } from '../types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle, CheckCircle, DollarSign, GripVertical, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface SortableBudgetItemProps {
  budget: Budget;
  categorySpending: CategorySpending | undefined;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

function SortableBudgetItem({ budget, categorySpending, onEdit, onDelete }: SortableBudgetItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: budget.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const percentage = categorySpending?.percentage || 0;

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg border-primary' : ''
      }`}
    >
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="touch-manipulation cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            {getCategoryStatusIcon(percentage)}
            <h3 className="font-medium line-clamp-1">{budget.category_name}</h3>
          </div>
          <div className="flex flex-wrap gap-2 items-center mt-1 sm:mt-0">
            <div className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
              {formatCurrency(budget.amount)} budget
            </div>
            {categorySpending && (
              <div className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${
                percentage > 100
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                {formatCurrency(categorySpending.spent)} spent
              </div>
            )}
            {categorySpending && (
              <span
                className={`text-sm font-medium ml-1 whitespace-nowrap ${
                  percentage > 100
                    ? "text-red-600 dark:text-red-400"
                    : percentage > 85
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>

        {categorySpending && (
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full ${getProgressBarColor(percentage)}`}
              initial={{ width: 0 }}
              animate={{ width: getProgressBarWidth(percentage) }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            {categorySpending ? (
              percentage <= 100 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(budget.amount - (categorySpending?.spent || 0))} remaining
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  {formatCurrency((categorySpending?.spent || 0) - budget.amount)} over budget
                </span>
              )
            ) : (
              <span className="text-muted-foreground">No spending tracked</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(budget)}
              className="h-10 w-10 p-0 touch-manipulation"
              aria-label={`Edit budget for ${budget.category_name}`}
              title={`Edit budget for ${budget.category_name}`}
            >
              <Pencil className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(budget.id)}
              className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
              aria-label={`Delete budget for ${budget.category_name}`}
              title={`Delete budget for ${budget.category_name}`}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SortableBudgetListProps {
  budgets: Budget[];
  categorySpending: CategorySpending[];
  onReorder: (newOrder: Budget[]) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export function SortableBudgetList({ budgets, categorySpending, onReorder, onEdit, onDelete }: SortableBudgetListProps) {
  const [activeFilter, setActiveFilter] = useState<BudgetFilter>('all');
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = budgets.findIndex((budget) => budget.id === active.id);
      const newIndex = budgets.findIndex((budget) => budget.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newBudgets = arrayMove(budgets, oldIndex, newIndex);
        // Update with new order
        onReorder(newBudgets);
      }
    }
  };

  // Filter the budgets based on the active filter
  const filteredBudgets = budgets.filter(budget => {
    if (activeFilter === 'all') return true;
    
    const spendingForBudget = categorySpending.find(cat => cat.category_id === budget.category_id);
    
    if (!spendingForBudget) return activeFilter === 'under-budget'; // If no spending, count as under budget
    
    if (activeFilter === 'over-budget') {
      return spendingForBudget.percentage > 100;
    } else if (activeFilter === 'under-budget') {
      return spendingForBudget.percentage <= 100;
    }
    
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex justify-between items-center mb-4 px-4">
        <h3 className="text-lg font-medium">Budget Progress</h3>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="h-8 rounded-none px-2.5"
            >
              All
            </Button>
            <Button 
              variant={activeFilter === 'over-budget' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('over-budget')}
              className="h-8 rounded-none px-2.5"
            >
              Over Budget
            </Button>
            <Button 
              variant={activeFilter === 'under-budget' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('under-budget')}
              className="h-8 rounded-none px-2.5"
            >
              Under Budget
            </Button>
          </div>
        </div>
      </div>

      {filteredBudgets.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredBudgets.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y p-4">
              {filteredBudgets.map((budget) => (
                <SortableBudgetItem
                  key={budget.id}
                  budget={budget}
                  categorySpending={categorySpending.find(cat => cat.category_id === budget.category_id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-8 text-center">
          <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          {budgets.length > 0 ? (
            <>
              <h3 className="text-lg font-medium">No budgets match the filter</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                Try changing the filter or add more budgets
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium">No budgets set yet</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                Start by creating your first budget to track your spending
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
} 
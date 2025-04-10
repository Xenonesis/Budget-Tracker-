export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  period: "monthly" | "weekly" | "yearly";
  created_at: string;
  order?: number; // For drag-and-drop order
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  spent: number;
  budget: number;
  percentage: number;
}

export type BudgetFilter = 'all' | 'over-budget' | 'under-budget'; 
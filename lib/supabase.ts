import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  })
  throw new Error("Missing Supabase environment variables")
}

// Create Supabase client
console.log('Initializing Supabase client with URL:', supabaseUrl)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category_id: string
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category_id: string
          description?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category_id?: string
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          period: 'weekly' | 'monthly' | 'yearly'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          period: 'weekly' | 'monthly' | 'yearly'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          period?: 'weekly' | 'monthly' | 'yearly'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          currency: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          currency?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          currency?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      monthly_spending: {
        Row: {
          user_id: string
          month: string
          category_name: string
          total_expenses: number
          total_income: number
        }
      }
      budget_vs_actual: {
        Row: {
          user_id: string
          category_name: string
          budget_amount: number
          period: string
          actual_amount: number
          difference: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
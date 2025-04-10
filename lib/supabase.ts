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

// Create Supabase client with improved session handling
console.log('Initializing Supabase client with URL:', supabaseUrl)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'budget-auth-token',
    // Use localStorage for more reliable token storage when cookies fail
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null
        }
        // Try to get from localStorage first (more reliable)
        const fromLocalStorage = window.localStorage.getItem(key)
        if (fromLocalStorage) {
          return fromLocalStorage
        }
        
        // Fallback to sessionStorage if localStorage fails
        return window.sessionStorage.getItem(key)
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') {
          return
        }
        // Set in both storages for redundancy
        window.localStorage.setItem(key, value)
        window.sessionStorage.setItem(key, value)
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') {
          return
        }
        window.localStorage.removeItem(key)
        window.sessionStorage.removeItem(key)
      },
    },
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
})

// Handle auth session changes
if (typeof window !== 'undefined') {
  // Set up auth state listener to handle token refresh errors
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      // Clean local storage on logout
      localStorage.removeItem('budget-auth-token')
      sessionStorage.removeItem('budget-auth-token')
      
      // Clean up any other auth-related storage
      for (const key of Object.keys(localStorage)) {
        if (key.includes('supabase.auth') || key.includes('budget-auth')) {
          localStorage.removeItem(key)
        }
      }
    }
  })
}

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
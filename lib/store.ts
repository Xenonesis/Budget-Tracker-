import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { supabase } from './supabase';

export interface UserPreferences {
  userId: string | null;
  username: string;
  currency: string; 
  theme: 'light' | 'dark' | 'system';
  initialized: boolean;
  setUserId: (userId: string | null) => void;
  setUsername: (username: string) => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  syncWithDatabase: () => Promise<void>;
  setInitialized: (initialized: boolean) => void;
  resetPreferences: () => void;
}

// Safe way to access localStorage that works in both client and server contexts
const getDefaultCurrency = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('budget-currency') || 'USD';
  }
  return 'USD'; // Default for server-side rendering
}

const getDefaultTheme = () => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('budget-theme') as 'light' | 'dark' | 'system') || 'system';
  }
  return 'system'; // Default for server-side rendering
}

export const useUserPreferences = create<UserPreferences>()(
  persist(
    (set, get) => ({
      userId: null,
      username: '',
      currency: getDefaultCurrency(),
      theme: getDefaultTheme(),
      initialized: false,
      setUserId: (userId: string | null) => set({ userId }),
      setUsername: (username: string) => set({ username }),
      setCurrency: (currency: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('budget-currency', currency); // Redundant storage for reliability
        }
        set({ currency });
      },
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
      setInitialized: (initialized: boolean) => set({ initialized }),
      resetPreferences: () => set({
        userId: null,
        username: '',
        currency: 'USD',
        theme: 'system',
        initialized: false
      }),
      syncWithDatabase: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          // Fetch user profile from database
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching user profile for sync:', error);
            
            // Attempt to fall back to auth metadata if profile fetch fails
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user?.user_metadata?.preferred_currency) {
              const preferredCurrency = userData.user.user_metadata.preferred_currency;
              
              // Update local store with auth metadata values
              set({
                username: userData.user.user_metadata?.name || get().username,
                currency: preferredCurrency,
                initialized: true
              });
              
              // Also update localStorage for redundancy
              if (typeof window !== 'undefined') {
                localStorage.setItem('budget-currency', preferredCurrency);
              }
            }
            
            return;
          }
          
          if (data) {
            // Default to USD if no currency is set
            const defaultCurrency = data.currency || 'USD';
            
            // Update local store with database values
            set({
              username: data.name || get().username,
              currency: defaultCurrency,
              initialized: true
            });

            // Also update localStorage for redundancy
            if (typeof window !== 'undefined') {
              localStorage.setItem('budget-currency', defaultCurrency);
              console.log('Currency set in localStorage:', defaultCurrency);
            }

            // Update user metadata in auth to keep everything in sync
            await supabase.auth.updateUser({
              data: {
                name: data.name || get().username,
                preferred_currency: defaultCurrency
              }
            });
            
            console.log('Currency synced from database:', defaultCurrency);
          }
        } catch (error) {
          console.error('Error syncing user preferences with database:', error);
        }
      }
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem(name);
          }
          return null;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, value);
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      })),
      partialize: (state) => ({ 
        userId: state.userId,
        username: state.username, 
        currency: state.currency,
        theme: state.theme,
        initialized: state.initialized
      }),
    }
  )
);

// Initialize theme based on stored preference - CLIENT SIDE ONLY
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('budget-theme') || 
                      useUserPreferences.getState().theme || 
                      'system';
                      
  if (storedTheme === 'dark' || 
      (storedTheme === 'system' && 
       window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Update currency and theme in user profile when they change - CLIENT SIDE ONLY
if (typeof window !== 'undefined') {
  useUserPreferences.subscribe((state) => {
    if (state.currency) {
      localStorage.setItem('budget-currency', state.currency);
    }
    if (state.theme) {
      localStorage.setItem('budget-theme', state.theme);
      
      if (state.theme === 'system') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });
}

export const formatCurrency = (
  amount: number,
  currency?: string
) => {
  // Get from parameter, or get from store, or fallback to USD as last resort
  const currencyToUse = currency || useUserPreferences.getState().currency || 
    (typeof window !== 'undefined' ? localStorage.getItem('budget-currency') : null) || 'USD';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // If there's an invalid currency code, fall back to USD
    console.error('Error formatting currency:', error);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}; 
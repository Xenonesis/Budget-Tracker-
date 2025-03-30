import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"
import { formatCurrency as formatCurrencyFromStore } from "./store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Legacy function, uses the one from store.ts
export function formatCurrency(amount: number, currency?: string) {
  return formatCurrencyFromStore(amount, currency);
}

export function formatDate(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Ensure the user has a profile record
export async function ensureUserProfile(
  userId: string, 
  email?: string, 
  name?: string | null, 
  currency?: string
) {
  try {
    // Skip the profile check if we don't have a userId
    if (!userId) {
      console.error("No user ID provided to ensureUserProfile");
      return false;
    }
    
    // Get user's preferred currency from metadata if not provided
    if (!currency) {
      const { data: userData } = await supabase.auth.getUser();
      currency = userData?.user?.user_metadata?.preferred_currency || 'USD';
    }
    
    console.log("Checking profile for user:", userId);
    
    // Check if profile exists first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, currency')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error checking profile:", JSON.stringify(profileError));
    }
    
    // If profile exists, update if necessary
    if (profileData) {
      // Only update if name or currency is missing
      if (!profileData.name || !profileData.currency) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: name || profileData.name || 'User',
            currency: currency || profileData.currency || 'USD',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error("Error updating profile:", JSON.stringify(updateError));
          return false;
        }
      }
      return true;
    }
    
    // Profile doesn't exist - try with RPC function if available
    try {
      // Try calling a server function to create the profile (bypasses RLS)
      const { error: rpcError } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        user_email: email || '',
        user_name: name || 'User',
        user_currency: currency || 'USD'
      });
      
      if (rpcError) {
        console.error("Error creating profile via RPC:", JSON.stringify(rpcError));
        // Fall back to direct insert as last resort
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email || '',
            name: name || 'User',
            currency: currency || 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error creating profile directly:", JSON.stringify(insertError));
          return false;
        }
      }
      
      return true;
    } catch (createErr) {
      console.error("Caught error during profile creation:", createErr);
      return false;
    }
  } catch (error) {
    console.error("Profile check error:", error);
    return false;
  }
}

export function calculateNextRecurringDate(
  lastDate: Date | string, 
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually" | string,
  timezone?: string
): Date {
  try {
    // Convert to Date object if string
    const date = typeof lastDate === 'string' ? new Date(lastDate) : new Date(lastDate);
    
    // Create a new date object to avoid modifying the input
    const nextDate = new Date(date);
    
    // Apply timezone if provided
    if (timezone) {
      // Format with the timezone and then parse back to ensure correct date
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone
      }).format(nextDate);
      
      const [month, day, year] = dateStr.split('/');
      nextDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case "monthly":
        // Handle edge cases like Jan 31 -> Feb 28/29
        const currentMonth = nextDate.getMonth();
        nextDate.setMonth(currentMonth + 1);
        
        // If the day changed (due to month length differences), set to last day of target month
        if (nextDate.getMonth() !== ((currentMonth + 1) % 12)) {
          nextDate.setDate(0); // Set to last day of previous month
        }
        break;
      case "quarterly":
        // Similar edge case handling as monthly
        const currentMonthQ = nextDate.getMonth();
        nextDate.setMonth(currentMonthQ + 3);
        
        // Handle day overflow
        if (nextDate.getMonth() !== ((currentMonthQ + 3) % 12)) {
          nextDate.setDate(0);
        }
        break;
      case "annually":
        // Handle Feb 29 on leap years
        const currentYear = nextDate.getFullYear();
        nextDate.setFullYear(currentYear + 1);
        
        // Check if we were on Feb 29 and now on Mar 1 (meaning the next year is not a leap year)
        if (nextDate.getMonth() === 2 && nextDate.getDate() === 1 && 
            date.getMonth() === 1 && date.getDate() === 29) {
          // Set to Feb 28 instead
          nextDate.setDate(28);
          nextDate.setMonth(1);
        }
        break;
      default:
        // Default to monthly if unknown frequency
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  } catch (error) {
    console.error("Error calculating next recurring date:", error);
    // Return a safe default - one month from now
    const fallbackDate = new Date();
    fallbackDate.setMonth(fallbackDate.getMonth() + 1);
    return fallbackDate;
  }
}

/**
 * Gets the user's current timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error("Error getting timezone:", error);
    return "UTC"; // Default fallback
  }
}

// Format date with timezone awareness
export function formatDateWithTimezone(dateString: string, timezone?: string): string {
  try {
    const userTimezone = timezone || getUserTimezone();
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone
    }).format(date);
  } catch (error) {
    console.error("Error formatting date with timezone:", error);
    return dateString; // Return original string as fallback
  }
}

// Local Storage Utilities for Data Persistence
const STORAGE_KEYS = {
  TRANSACTIONS: 'budget_tracker_transactions',
  USER_PREFERENCES: 'budget_tracker_preferences',
  CATEGORIES: 'budget_tracker_categories',
  LAST_SYNC: 'budget_tracker_last_sync',
  OFFLINE_CHANGES: 'budget_tracker_offline_changes'
};

/**
 * Save data to localStorage with TTL (time-to-live)
 */
export function saveToLocalStorage<T>(key: string, data: T, ttlInMinutes: number = 60): void {
  try {
    const item = {
      data,
      expiry: ttlInMinutes ? Date.now() + ttlInMinutes * 60 * 1000 : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Get data from localStorage with expiry check
 */
export function getFromLocalStorage<T>(key: string): T | null {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    
    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data as T;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return null;
  }
}

/**
 * Queue changes when offline to sync later
 */
export function queueOfflineChange(change: { 
  type: 'create' | 'update' | 'delete', 
  entity: 'transaction' | 'category' | 'profile', 
  data: any 
}): void {
  try {
    const offlineChanges = getFromLocalStorage<any[]>(STORAGE_KEYS.OFFLINE_CHANGES) || [];
    offlineChanges.push({
      ...change,
      timestamp: Date.now(),
      id: change.data.id || crypto.randomUUID()
    });
    saveToLocalStorage(STORAGE_KEYS.OFFLINE_CHANGES, offlineChanges);
  } catch (error) {
    console.error('Error queuing offline change:', error);
  }
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync offline changes with the database when back online
 */
export async function syncOfflineChanges(supabaseClient: any): Promise<{ 
  success: boolean, 
  syncedCount: number, 
  errors: any[] 
}> {
  if (!isOnline()) {
    return { success: false, syncedCount: 0, errors: [{ message: 'Currently offline' }] };
  }
  
  const offlineChanges = getFromLocalStorage<any[]>(STORAGE_KEYS.OFFLINE_CHANGES) || [];
  
  if (offlineChanges.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }
  
  const results = {
    success: true,
    syncedCount: 0,
    errors: [] as any[]
  };
  
  // Sort by timestamp to maintain order of operations
  const sortedChanges = [...offlineChanges].sort((a, b) => a.timestamp - b.timestamp);
  const remainingChanges = [];
  
  for (const change of sortedChanges) {
    try {
      let result;
      
      switch (change.type) {
        case 'create':
          if (change.entity === 'transaction') {
            result = await supabaseClient.from('transactions').insert(change.data);
          } else if (change.entity === 'category') {
            result = await supabaseClient.from('categories').insert(change.data);
          }
          break;
          
        case 'update':
          if (change.entity === 'transaction') {
            result = await supabaseClient.from('transactions').update(change.data).eq('id', change.data.id);
          } else if (change.entity === 'category') {
            result = await supabaseClient.from('categories').update(change.data).eq('id', change.data.id);
          }
          break;
          
        case 'delete':
          if (change.entity === 'transaction') {
            result = await supabaseClient.from('transactions').delete().eq('id', change.data.id);
          } else if (change.entity === 'category') {
            result = await supabaseClient.from('categories').delete().eq('id', change.data.id);
          }
          break;
      }
      
      if (result && !result.error) {
        results.syncedCount++;
      } else if (result && result.error) {
        results.errors.push({
          change,
          error: result.error
        });
        remainingChanges.push(change);
        results.success = false;
      }
    } catch (error) {
      results.errors.push({
        change,
        error
      });
      remainingChanges.push(change);
      results.success = false;
    }
  }
  
  // Save any changes that failed back to the queue
  if (remainingChanges.length > 0) {
    saveToLocalStorage(STORAGE_KEYS.OFFLINE_CHANGES, remainingChanges);
  } else {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_CHANGES);
  }
  
  // Update the last sync time
  saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
  
  return results;
}

// Export the storage keys for use in components
export { STORAGE_KEYS }; 
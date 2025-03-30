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
    
    // Try to directly insert the profile first (upsert approach)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email || '',
        name: name || 'User',
        currency: currency,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
      
    if (upsertError) {
      console.error("Error upserting profile:", upsertError);
      
      // Fallback - try to check if profile exists
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, currency")
        .eq("id", userId)
        .maybeSingle();
        
      if (error) {
        console.error("Profile check error:", error);
        return false;
      }
      
      // Profile exists - ensure it has up-to-date values
      if (data) {
        // If profile exists but is missing important fields, update it
        if (!data.name || !data.currency) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: name || data.name || 'User',
              currency: currency || data.currency || 'USD',
              updated_at: new Date().toISOString()
            })
            .eq("id", userId);
            
          if (updateError) {
            console.error("Error updating profile fields:", updateError);
          }
        }
        
        return true;
      }
      
      // Last resort - try to create it
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email || '',
          name: name || 'User',
          currency: currency,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (createError) {
        console.error("Error creating profile:", createError);
        return false;
      }
    }
    
    return true;
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
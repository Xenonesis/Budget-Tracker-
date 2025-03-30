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
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "annually" | string
): Date {
  const nextDate = new Date(lastDate);
  
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
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "annually":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly if unknown frequency
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
} 
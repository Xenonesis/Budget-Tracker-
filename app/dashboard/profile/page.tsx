"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserPreferences } from "@/lib/store";
import { getUserTimezone, ensureUserProfile } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Moon, Sun, Laptop } from "lucide-react";
import { memo } from "react";

// Memoized form field component for better performance
function FormFieldComponent({ 
  label, 
  id, 
  name, 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "", 
  className = "",
  as = "input",
  children
}: {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  as?: "input" | "select";
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      {as === "input" ? (
        <Input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${disabled ? 'bg-muted' : ''} ${className}`}
        />
      ) : (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 ${className}`}
        >
          {children}
        </select>
      )}
    </div>
  );
}

const FormField = memo(FormFieldComponent);
FormField.displayName = "FormField";

// Memoized theme preview component
function ThemePreviewComponent() {
  return (
    <div className="flex flex-col gap-3 p-4 border rounded-md bg-card">
      <h4 className="text-sm font-medium">Theme Preview</h4>
      <div className="grid grid-cols-3 gap-2 mt-1">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center">
            <Sun className="h-4 w-4" />
          </div>
          <span className="text-xs mt-1">Light</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center">
            <Moon className="h-4 w-4" />
          </div>
          <span className="text-xs mt-1">Dark</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-900 flex items-center justify-center">
            <Laptop className="h-4 w-4" />
          </div>
          <span className="text-xs mt-1">System</span>
        </div>
      </div>
    </div>
  );
}

const ThemePreview = memo(ThemePreviewComponent);
ThemePreview.displayName = "ThemePreview";

export default function ProfilePage() {
  const userPreferences = useUserPreferences();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: userPreferences.currency || "USD",
    timezone: userPreferences.timezone || "UTC"
  });
  
  // Memoized fetch profile function
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!userData.user) {
        toast.error("Please log in to view your profile");
        return;
      }
      
      // Ensure profile exists
      await ensureUserProfile(userData.user.id, userData.user.email);
      
      // Get profile data
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
        
      if (error) throw error;
      
      // Set profile data and update user preferences
      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || userData.user.email || "",
          currency: data.currency || userPreferences.currency || "USD",
          timezone: data.timezone || userPreferences.timezone || getUserTimezone()
        });
        
        // Update store with profile values
        userPreferences.setUsername(data.name || "");
        userPreferences.setCurrency(data.currency || "USD");
        userPreferences.setTimezone(data.timezone || getUserTimezone());
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userPreferences]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Detect and set user's timezone if not already set
  useEffect(() => {
    const userTimezone = getUserTimezone();
    if (userTimezone && (!profile.timezone || profile.timezone === "UTC")) {
      setProfile(prev => ({ ...prev, timezone: userTimezone }));
      userPreferences.setTimezone(userTimezone);
    }
  }, [profile.timezone, userPreferences]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error("Please log in to update your profile");
        return;
      }
      
      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          currency: profile.currency,
          timezone: profile.timezone,
          updated_at: new Date().toISOString()
        })
        .eq("id", userData.user.id);
        
      if (error) throw error;
      
      // Update user preferences in store
      userPreferences.setUsername(profile.name);
      userPreferences.setCurrency(profile.currency);
      userPreferences.setTimezone(profile.timezone);
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }, [profile, userPreferences]);

  // Memoize the currency options to prevent re-renders
  const currencyOptions = useMemo(() => (
    <>
      <option value="USD">USD - United States Dollar</option>
      <option value="EUR">EUR - Euro</option>
      <option value="GBP">GBP - British Pound</option>
      <option value="JPY">JPY - Japanese Yen</option>
      <option value="CAD">CAD - Canadian Dollar</option>
      <option value="AUD">AUD - Australian Dollar</option>
      <option value="INR">INR - Indian Rupee</option>
      <option value="CNY">CNY - Chinese Yuan</option>
      <option value="BRL">BRL - Brazilian Real</option>
      <option value="MXN">MXN - Mexican Peso</option>
    </>
  ), []);

  // Memoize the timezone options to prevent re-renders
  const timezoneOptions = useMemo(() => {
    const userTz = getUserTimezone();
    return (
      <>
        <option value={userTz}>{userTz} (Your Location)</option>
        <option value="UTC">UTC (Coordinated Universal Time)</option>
        <option value="America/New_York">Eastern Time (ET)</option>
        <option value="America/Chicago">Central Time (CT)</option>
        <option value="America/Denver">Mountain Time (MT)</option>
        <option value="America/Los_Angeles">Pacific Time (PT)</option>
        <option value="Europe/London">London (GMT)</option>
        <option value="Europe/Paris">Paris (CET)</option>
        <option value="Asia/Tokyo">Tokyo (JST)</option>
        <option value="Asia/Kolkata">India (IST)</option>
        <option value="Australia/Sydney">Sydney (AEST)</option>
      </>
    );
  }, []);
  
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Name"
            id="name"
            name="name"
            value={profile.name}
            onChange={handleInputChange}
            placeholder="Your name"
          />
          
          <FormField
            label="Email (read-only)"
            id="email"
            name="email"
            value={profile.email}
            disabled={true}
          />
          
          <FormField
            label="Preferred Currency"
            id="currency"
            name="currency"
            value={profile.currency}
            onChange={handleInputChange}
            as="select"
          >
            {currencyOptions}
          </FormField>
          
          <FormField
            label="Timezone"
            id="timezone"
            name="timezone"
            value={profile.timezone}
            onChange={handleInputChange}
            as="select"
          >
            {timezoneOptions}
          </FormField>
          
          <div>
            <label className="block text-sm font-medium mb-3">
              Theme Preference
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 border rounded-md bg-card">
                <div className="mr-4">
                  <ThemeToggle className="w-full" iconOnly={false} variant="outline" size="default" />
                </div>
                <div>
                  <p className="text-sm font-medium">Quick Toggle</p>
                  <p className="text-xs text-muted-foreground">Switch between light, dark, or system theme</p>
                </div>
              </div>
              
              <ThemePreview />
            </div>
          </div>
          
          <div className="pt-4">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 
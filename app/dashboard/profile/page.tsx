"use client";

import { useState, useEffect } from "react";
import { useUserPreferences } from "@/lib/store";
import { getUserTimezone, ensureUserProfile } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ProfilePage() {
  const userPreferences = useUserPreferences();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: userPreferences.currency || "USD",
    timezone: userPreferences.timezone || "UTC"
  });
  
  useEffect(() => {
    async function fetchProfile() {
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
    }
    
    fetchProfile();
  }, [userPreferences]);
  
  // Detect and set user's timezone if not already set
  useEffect(() => {
    const userTimezone = getUserTimezone();
    if (userTimezone && (!profile.timezone || profile.timezone === "UTC")) {
      setProfile(prev => ({ ...prev, timezone: userTimezone }));
      userPreferences.setTimezone(userTimezone);
    }
  }, [profile.timezone, userPreferences]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
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
  };
  
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              placeholder="Your name"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email (read-only)
            </label>
            <Input
              id="email"
              name="email"
              value={profile.email}
              disabled
              className="w-full bg-muted"
            />
          </div>
          
          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              Preferred Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={profile.currency}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
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
            </select>
          </div>
          
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={profile.timezone}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value={getUserTimezone()}>{getUserTimezone()} (Your Location)</option>
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
            </select>
          </div>
          
          <div className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 
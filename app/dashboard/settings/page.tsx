"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUserPreferences } from "@/lib/store";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  address?: string;
  preferred_language?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  profile_photo?: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: {
    name?: string;
    preferred_currency?: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { 
    username, setCurrency, setUsername, theme, setTheme, 
    syncWithDatabase, setUserId 
  } = useUserPreferences();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currency: "USD",
    phone: "",
    address: "",
    preferred_language: "en",
    profile_photo: "",
    notification_preferences: {
      email: true,
      push: false,
      sms: false
    }
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [themeChoice, setThemeChoice] = useState<"light" | "dark" | "system">(theme || "system");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/login");
        return;
      }

      console.log("Auth user data:", userData.user);
      
      // Map the Supabase User to AuthUser interface
      const mappedAuthUser: AuthUser = {
        id: userData.user.id,
        email: userData.user.email || '',
        created_at: userData.user.created_at,
        last_sign_in_at: userData.user.last_sign_in_at,
        email_confirmed_at: userData.user.email_confirmed_at,
        app_metadata: userData.user.app_metadata,
        user_metadata: userData.user.user_metadata
      };
      
      setAuthUser(mappedAuthUser);
      
      // Set user ID in preferences store
      setUserId(userData.user.id);

      // Check if a profile exists for this user
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        
        // If the profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log("Profile not found, creating a new one...");
          
          const newProfile = {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || '',
            currency: userData.user.user_metadata?.preferred_currency || 'USD',
            phone: userData.user.user_metadata?.phone || '',
            address: userData.user.user_metadata?.address || '',
            preferred_language: userData.user.user_metadata?.preferred_language || 'en',
            notification_preferences: userData.user.user_metadata?.notification_preferences || {
              email: true,
              push: false,
              sms: false
            },
            profile_photo: userData.user.user_metadata?.profile_photo || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from("profiles")
            .insert(newProfile);
            
          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            console.log("New profile created successfully");
            setProfile(newProfile as Profile);
            
            // Update the global store
            setUsername(newProfile.name || '');
            setCurrency(newProfile.currency);
            
            setFormData({
              name: newProfile.name || '',
              email: newProfile.email || '',
              currency: newProfile.currency,
              phone: newProfile.phone || '',
              address: newProfile.address || '',
              preferred_language: newProfile.preferred_language || 'en',
              profile_photo: newProfile.profile_photo || '',
              notification_preferences: newProfile.notification_preferences || {
                email: true,
                push: false,
                sms: false
              }
            });
            setLoading(false);
            return;
          }
        }
        return;
      }

      console.log("Profile data fetched:", data);
      setProfile(data);
      
      // Sync with user preferences store
      await syncWithDatabase();
      
      // Get the best possible values for form data
      const username = data.name || userData.user.user_metadata?.name || '';
      const currency = data.currency || userData.user.user_metadata?.preferred_currency || 'USD';
      const phone = data.phone || userData.user.user_metadata?.phone || '';
      const address = data.address || userData.user.user_metadata?.address || '';
      const preferred_language = data.preferred_language || userData.user.user_metadata?.preferred_language || 'en';
      const notification_preferences = data.notification_preferences || userData.user.user_metadata?.notification_preferences || {
        email: true,
        push: false,
        sms: false
      };
      const profile_photo = data.profile_photo || userData.user.user_metadata?.profile_photo || '';
      
      // Update the global store
      setUsername(username);
      setCurrency(currency);
      
      // Make sure we're using data from both auth and profile
      setFormData({
        name: username,
        email: data.email || userData.user.email || '',
        currency,
        phone,
        address,
        preferred_language,
        profile_photo,
        notification_preferences
      });
      
      console.log("Form data set:", {
        name: username,
        email: data.email || userData.user.email || '',
        currency,
        phone,
        address,
        preferred_language,
        profile_photo,
        notification_preferences
      });
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setThemeChoice(value);
    setTheme(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          preferred_currency: formData.currency,
          phone: formData.phone,
          address: formData.address,
          preferred_language: formData.preferred_language,
          notification_preferences: formData.notification_preferences,
          profile_photo: formData.profile_photo,
          updated_at: new Date().toISOString(),
        },
      });

      if (authError) throw authError;

      // Update profile table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          currency: formData.currency,
          phone: formData.phone,
          address: formData.address,
          preferred_language: formData.preferred_language,
          notification_preferences: formData.notification_preferences,
          profile_photo: formData.profile_photo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.user.id);

      if (profileError) throw profileError;

      // Update the global store
      setUsername(formData.name);
      setCurrency(formData.currency);
      
      // Set directly in localStorage for immediate effect
      if (typeof window !== 'undefined') {
        localStorage.setItem('budget-currency', formData.currency);
        console.log('Currency set in settings:', formData.currency);
      }
      
      // Sync with database to ensure everything is up to date
      await syncWithDatabase();

      setMessage({
        type: "success",
        text: "Profile updated successfully",
      });

      // Refresh profile data
      await fetchProfile();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const exportProfileToPDF = async () => {
    try {
      setSaving(true);
      
      // Dynamic import to reduce bundle size
      const jsPDF = (await import('jspdf')).default;
      
      // Create document
      const doc = new jsPDF();
      
      // Add title and styling
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text("User Profile", 105, 20, { align: 'center' });
      
      // Add horizontal line
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Add profile information
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      
      let yPosition = 40;
      const leftMargin = 20;
      const lineHeight = 10;
      
      // Add user details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Personal Information", leftMargin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      yPosition += lineHeight + 5;
      doc.text(`Name: ${formData.name || 'Not provided'}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`Email: ${formData.email}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`Phone: ${formData.phone || 'Not provided'}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`Address: ${formData.address || 'Not provided'}`, leftMargin, yPosition);
      
      yPosition += lineHeight + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Preferences", leftMargin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      yPosition += lineHeight + 5;
      doc.text(`Currency: ${formData.currency}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`Language: ${formData.preferred_language || 'English'}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`Theme: ${themeChoice}`, leftMargin, yPosition);
      
      yPosition += lineHeight + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Notification Preferences", leftMargin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      yPosition += lineHeight + 5;
      doc.text(`Email notifications: ${formData.notification_preferences?.email ? 'Enabled' : 'Disabled'}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`Push notifications: ${formData.notification_preferences?.push ? 'Enabled' : 'Disabled'}`, leftMargin, yPosition);
      
      yPosition += lineHeight;
      doc.text(`SMS notifications: ${formData.notification_preferences?.sms ? 'Enabled' : 'Disabled'}`, leftMargin, yPosition);
      
      // Add footer with generation date
      doc.setFontSize(10);
      doc.setTextColor(127, 140, 141);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        105,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      
      // Save PDF
      doc.save(`user_profile_${new Date().toISOString().slice(0,10)}.pdf`);
      
      toast.success("Profile exported to PDF successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportProfileToPDF}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export Profile
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xl font-semibold">Personal Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground ring-offset-background"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                      Phone Number (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="mb-2 block text-sm font-medium">
                      Address (optional)
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Your address"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="mb-4 text-xl font-semibold">Preferences</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currency" className="mb-2 block text-sm font-medium">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="JPY">Japanese Yen (JPY)</option>
                      <option value="CNY">Chinese Yuan (CNY)</option>
                      <option value="INR">Indian Rupee (INR)</option>
                      <option value="CAD">Canadian Dollar (CAD)</option>
                      <option value="AUD">Australian Dollar (AUD)</option>
                      <option value="SGD">Singapore Dollar (SGD)</option>
                      <option value="CHF">Swiss Franc (CHF)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="preferred_language" className="mb-2 block text-sm font-medium">
                      Language
                    </label>
                    <select
                      id="preferred_language"
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="ar">Arabic</option>
                      <option value="ru">Russian</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium">Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={themeChoice === "light" ? "default" : "outline"}
                        onClick={() => handleThemeChange("light")}
                        className="justify-start"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="mr-2 h-4 w-4"
                        >
                          <circle cx="12" cy="12" r="4" strokeWidth="2" />
                          <path
                            strokeLinecap="round"
                            strokeWidth="2"
                            d="M12 2v2m0 16v2M4 12H2m20 0h-2m-14 6l-2 2m2-16L4 4m16 16l2 2m-2-16l2-2"
                          />
                        </svg>
                        Light
                      </Button>
                      <Button
                        type="button"
                        variant={themeChoice === "dark" ? "default" : "outline"}
                        onClick={() => handleThemeChange("dark")}
                        className="justify-start"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="mr-2 h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeWidth="2"
                            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
                          />
                        </svg>
                        Dark
                      </Button>
                      <Button
                        type="button"
                        variant={themeChoice === "system" ? "default" : "outline"}
                        onClick={() => handleThemeChange("system")}
                        className="justify-start"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="mr-2 h-4 w-4"
                        >
                          <rect width="18" height="14" x="3" y="3" rx="2" strokeWidth="2" />
                          <path strokeLinecap="round" strokeWidth="2" d="M4 17h16M12 21v-4" />
                        </svg>
                        System
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium">Notification Preferences</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="email_notifications"
                          checked={formData.notification_preferences?.email ?? true}
                          onChange={(e) => setFormData({
                            ...formData,
                            notification_preferences: {
                              ...formData.notification_preferences,
                              email: e.target.checked
                            }
                          })}
                          className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="email_notifications" className="ml-2 text-sm">
                          Email Notifications
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="push_notifications"
                          checked={formData.notification_preferences?.push ?? false}
                          onChange={(e) => setFormData({
                            ...formData,
                            notification_preferences: {
                              ...formData.notification_preferences,
                              push: e.target.checked
                            }
                          })}
                          className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="push_notifications" className="ml-2 text-sm">
                          Push Notifications
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sms_notifications"
                          checked={formData.notification_preferences?.sms ?? false}
                          onChange={(e) => setFormData({
                            ...formData,
                            notification_preferences: {
                              ...formData.notification_preferences,
                              sms: e.target.checked
                            }
                          })}
                          className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="sms_notifications" className="ml-2 text-sm">
                          SMS Notifications
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {message && (
              <div
                className={`mt-6 rounded-md p-4 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50"
                    : "bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-50"
                }`}
              >
                {message.text}
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
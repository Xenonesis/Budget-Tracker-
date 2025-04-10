"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ensureUserProfile } from "@/lib/utils";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useUserPreferences } from "@/lib/store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCurrentUser } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  section?: 'primary' | 'financial' | 'secondary';
  badge?: string;
  activePattern?: RegExp;
}

// Memoized sidebar navigation item to prevent unnecessary renders
function NavItemComponent({ item, pathname, onClick }: { 
  item: NavItem; 
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        className={`group flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 ${
          pathname === item.href || (item.activePattern && pathname.match(item.activePattern))
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
        onClick={onClick}
      >
        <span className={`nav-item-icon ${
          pathname === item.href || (item.activePattern && pathname.match(item.activePattern))
            ? "nav-item-active"
            : "nav-item-inactive"
        }`}>
          {item.icon}
        </span>
        {item.title}
        {item.badge && (
          <span className="nav-item-badge">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

const NavItem = memo(NavItemComponent);
NavItem.displayName = 'NavItem';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { 
    setUserId, 
    setUsername, 
    setCurrency, 
    userId, 
    initialized,
    syncWithDatabase,
    setInitialized
  } = useUserPreferences();

  // Memoize the sign out handler to prevent recreating it on each render
  const handleSignOut = useCallback(async () => {
    // Clear user preferences when signing out
    setUserId(null);
    setUsername('');
    setCurrency('USD');
    
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }, [router, setUserId, setUsername, setCurrency]);

  // Memoize the sidebar toggle handler
  const toggleSidebar = useCallback(() => {
    // Add a class to show the sidebar but preserve scrolling
    document.documentElement.classList.toggle("sidebar-open");
    
    // Toggle ARIA expanded state for accessibility
    const menuButton = document.querySelector('[aria-label="Toggle menu"]');
    if (menuButton) {
      const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', (!isExpanded).toString());
    }
  }, []);

  // Memoize the sidebar close handler 
  const closeSidebar = useCallback(() => {
    // Remove the sidebar class to hide it
    document.documentElement.classList.remove("sidebar-open");
    
    // Update ARIA expanded state
    const menuButton = document.querySelector('[aria-label="Toggle menu"]');
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', 'false');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      try {
        // Use our improved auth helper for more reliable auth state
        const { user, error } = await getCurrentUser();
        
        if (error) {
          console.error("Auth error:", error.message);
          // Check if the error is refresh token related
          if (error.message?.includes("Refresh Token") || 
              error.message?.includes("Invalid token") ||
              error.message?.includes("JWT expired")) {
            // Clear any invalid tokens
            if (typeof window !== 'undefined') {
              for (const key of Object.keys(localStorage)) {
                if (key.includes('supabase.auth') || key.includes('budget-auth')) {
                  localStorage.removeItem(key);
                }
              }
            }
            router.push("/auth/login?error=session_expired");
            return;
          }
        }
        
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        setUser(user);
        
        // Set the user ID in the store
        setUserId(user.id);
        
        // Extract preferred currency from user metadata if it exists
        const preferredCurrency = user.user_metadata?.preferred_currency;
        if (preferredCurrency) {
          // Set currency directly to avoid timing issues
          setCurrency(preferredCurrency);
          // Store in localStorage for redundancy
          if (typeof window !== 'undefined') {
            localStorage.setItem('budget-currency', preferredCurrency);
          }
        }
        
        // Ensure profile exists using the utility function
        try {
          const profileCreated = await ensureUserProfile(
            user.id, 
            user.email, 
            user.user_metadata?.name,
            preferredCurrency
          );
          
          if (!profileCreated) {
            console.log("Profile creation failed on first attempt, retrying once...");
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Retry once
            await ensureUserProfile(
              user.id, 
              user.email, 
              user.user_metadata?.name,
              preferredCurrency
            );
          }
        } catch (profileError) {
          console.error("Error ensuring user profile:", profileError);
          // Continue anyway - the app can still function without a complete profile
        }
        
        // Sync user preferences if not already initialized
        if (!initialized || userId !== user.id) {
          await syncWithDatabase();
          setInitialized(true);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        
        // Check if there's a specific auth error that requires redirection
        let needsRedirect = false;
        if (typeof error === 'object' && error !== null) {
          if ('status' in error && error.status === 401) {
            needsRedirect = true;
          } else if ('message' in error && 
                    (String(error.message).includes('token') || 
                     String(error.message).includes('auth') ||
                     String(error.message).includes('session'))) {
            needsRedirect = true;
          }
        }
        
        if (needsRedirect) {
          router.push("/auth/login?error=session_error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Subscribe to auth state changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event);
        
        if (event === 'TOKEN_REFRESHED') {
          // Token was successfully refreshed, no need to redirect
          console.log("Token refreshed successfully");
        } else if (!session && isMounted) {
          console.log("No session in auth state change");
          router.push("/auth/login");
        }
      }
    );

    getUser();

    // Clean up function
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router, setUserId, setCurrency, syncWithDatabase, initialized, userId, setInitialized]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile sidebar toggle handler with window width check
  const handleSidebarToggleForMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      closeSidebar();
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-md pt-safe md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="relative h-9 w-9 flex-shrink-0">
            <Image 
              src="/logo.svg" 
              alt="Budget Buddy Logo" 
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Budget Buddy</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Smart Money Management</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle iconOnly />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 transition-transform"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            aria-expanded="false"
            aria-controls="mobile-sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        id="mobile-sidebar"
        className="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full transform overflow-y-auto border-r bg-card/95 backdrop-blur-md transition-transform duration-300 ease-in-out pt-safe md:sticky md:translate-x-0 md:flex md:flex-col sidebar-open:translate-x-0 modal-container"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b px-6 sticky top-0 bg-card/95 backdrop-blur-md z-10">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="relative h-9 w-9 flex-shrink-0">
              <Image 
                src="/logo.svg" 
                alt="Budget Buddy Logo" 
                width={36}
                height={36}
                className="h-9 w-9"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Budget Buddy</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Smart Money Management</span>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 transition-transform md:hidden"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-auto py-6 px-4">
          {/* Primary navigation section */}
          <div className="sidebar-section">
            <h2 className="sidebar-heading">
              Overview
            </h2>
            <ul className="sidebar-nav-list">
              {navItems.filter(item => item.section === 'primary').map((item) => (
                <NavItem 
                  key={item.href} 
                  item={item} 
                  pathname={pathname} 
                  onClick={handleSidebarToggleForMobile}
                />
              ))}
            </ul>
          </div>
          
          {/* Financial section */}
          <div className="sidebar-section">
            <h2 className="sidebar-heading">
              Financial
            </h2>
            <ul className="sidebar-nav-list">
              {navItems.filter(item => item.section === 'financial').map((item) => (
                <NavItem 
                  key={item.href} 
                  item={item} 
                  pathname={pathname} 
                  onClick={handleSidebarToggleForMobile}
                />
              ))}
            </ul>
          </div>
          
          {/* Secondary navigation section */}
          <div className="sidebar-section">
            <h2 className="sidebar-heading">
              Other
            </h2>
            <ul className="sidebar-nav-list">
              {navItems.filter(item => item.section === 'secondary').map((item) => (
                <NavItem 
                  key={item.href} 
                  item={item} 
                  pathname={pathname} 
                  onClick={handleSidebarToggleForMobile}
                />
              ))}
            </ul>
          </div>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {user?.user_metadata?.name?.[0] || user?.email?.[0] || "U"}
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[130px]">
                  {user?.user_metadata?.name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[130px]">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle iconOnly size="sm" />
              <button
                className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 transition-transform"
                onClick={handleSignOut}
                title="Sign out"
                aria-label="Sign out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content overlay for mobile */}
      <div 
        className="fixed inset-0 z-30 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300 md:hidden sidebar-open:opacity-100 sidebar-open:pointer-events-auto"
        onClick={closeSidebar}
      ></div>
      
      {/* Bottom Mobile Navigation - replaced with BottomNavigation component */}
      <BottomNavigation />

      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
    </div>
  );
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
    ),
    section: 'primary',
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    section: 'financial',
    badge: "New",
  },
  {
    title: "Budget",
    href: "/dashboard/budget",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
      </svg>
    ),
    section: 'financial',
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    section: 'financial',
  },
  {
    title: "AI Insights",
    href: "/dashboard/ai-insights",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15.5 2c1.53 0 2.5 1.67 2.5 3v3c0 1.33-.97 3-2.5 3S13 9.33 13 8V5c0-1.33.97-3 2.5-3Z"></path>
        <path d="M10 9v1a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5V9"></path>
        <path d="M17 22a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3Z"></path>
        <path d="M2 12v1a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5v-1"></path>
        <path d="M8.5 9c-1.53 0-2.5-1.67-2.5-3V3c0-1.33.97-3 2.5-3S11 1.67 11 3v3c0 1.33-.97 3-2.5 3Z"></path>
        <path d="M7 22a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H7Z"></path>
      </svg>
    ),
    section: 'primary',
    activePattern: /^\/dashboard\/ai-insights/,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ),
    section: 'secondary',
  },
  {
    title: "About",
    href: "/dashboard/about",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    ),
    section: 'secondary',
  },
]; 
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart2, PlusCircle, FileText, User, Sparkles, Menu } from "lucide-react";
import { memo, useMemo, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

// Memoized navigation item to prevent unnecessary re-renders
const NavItemButton = memo(({ item }: { item: NavItem }) => (
  <Link
    href={item.href}
    className="bottom-nav-item"
    data-active={item.active ? "true" : "false"}
  >
    <motion.div 
      className={`bottom-nav-icon ${item.active ? "bg-primary/15 backdrop-blur-md border border-primary/10" : ""}`}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative z-10">
        {item.icon}
      </div>
      {item.active && (
        <motion.div 
          className="absolute inset-0 rounded-full bg-primary/5 blur-md"
          layoutId="activeIconGlow"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </motion.div>
    <span className={`${item.active ? "font-medium text-primary" : "text-muted-foreground"}`}>{item.label}</span>
    {item.active && (
      <motion.div 
        className="bottom-nav-active-indicator"
        layoutId="activeTab"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
  </Link>
));

NavItemButton.displayName = 'NavItemButton';

// Function to create a basic toast/notification
const showToast = (message: string) => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium shadow-lg';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Add animation classes
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
  
  // Initial animation
  setTimeout(() => {
    toast.classList.add('transition-opacity', 'duration-300');
  }, 10);
};

// Function component definition for BottomNavigation
function BottomNavigationComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle scroll behavior to hide/show navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Handle FAB button click
  const handleFabClick = useCallback(() => {
    if (pathname.includes('/dashboard/transactions')) {
      // If we're already in transactions, just show a message
      showToast('Add transaction form opened');
    } else {
      // Navigate to transactions page and show a message
      router.push('/dashboard/transactions?action=new');
    }
  }, [pathname, router]);
  
  // Use useMemo to avoid recreating nav items on each render
  const navItems = useMemo(() => [
    {
      href: "/dashboard",
      icon: <Home size={22} />,
      label: "Home",
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/transactions",
      icon: <FileText size={22} />,
      label: "Transactions",
      active: pathname.startsWith("/dashboard/transactions"),
    },
    {
      href: "/dashboard/ai-insights",
      icon: <Sparkles size={22} />,
      label: "AI",
      active: pathname.startsWith("/dashboard/ai-insights"),
    },
    {
      href: "/dashboard/budget",
      icon: <BarChart2 size={22} />,
      label: "Budget",
      active: pathname.startsWith("/dashboard/budget"),
    },
    {
      href: "/dashboard/settings",
      icon: <User size={22} />,
      label: "Profile",
      active: pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/profile"),
    },
  ], [pathname]);

  // Split the navigation items for the bottom bar (before and after the FAB)
  const leftNavItems = navItems.slice(0, 2);
  const rightNavItems = navItems.slice(2);

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      initial={{ y: 0 }}
      animate={{ y: showNav ? 0 : 100 }}
      transition={{ duration: 0.3, type: "spring", damping: 20 }}
    >
      <div className="relative">
        {/* Floating Action Button */}
        <motion.button
          onClick={handleFabClick}
          className="absolute -top-8 left-1/2 z-10 h-16 w-16 -translate-x-1/2 fab-button shadow-lg overflow-hidden"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
          aria-label="Add Transaction"
        >
          <div className="absolute inset-0 bg-primary-gradient opacity-80"></div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <span className="relative z-10">
            <PlusCircle size={28} />
          </span>
        </motion.button>
        
        {/* Bottom navigation bar */}
        <div className="navbar-glass">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-40"></div>
            <div className="flex items-center justify-between px-2 relative z-10">
              {/* Left nav items */}
              <div className="flex">
                {leftNavItems.map((item) => (
                  <NavItemButton key={item.href} item={item} />
                ))}
              </div>
              
              {/* Empty space for FAB */}
              <div className="w-16"></div>
              
              {/* Right nav items */}
              <div className="flex">
                {rightNavItems.map((item) => (
                  <NavItemButton key={item.href} item={item} />
                ))}
              </div>
            </div>
          </div>
          <div className="h-safe-area-bottom bg-background/90"></div>
        </div>
      </div>
    </motion.div>
  );
}

// Function component definition for AddTransactionButton
function AddTransactionButtonComponent({ 
  onClick 
}: { 
  onClick: () => void 
}) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50 h-16 w-16 md:hidden fab-button"
      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
      whileTap={{ scale: 0.95 }}
      aria-label="Add Transaction"
    >
      <PlusCircle size={28} />
    </motion.button>
  );
}

// Create memoized versions
const MemoizedBottomNavigation = memo(BottomNavigationComponent);
MemoizedBottomNavigation.displayName = 'BottomNavigation';

const MemoizedAddTransactionButton = memo(AddTransactionButtonComponent);
MemoizedAddTransactionButton.displayName = 'AddTransactionButton';

// Export both the memoized versions with the original names
export { MemoizedBottomNavigation as BottomNavigation, MemoizedAddTransactionButton as AddTransactionButton }; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, PlusCircle, FileText, User, Info } from "lucide-react";
import { memo, useMemo } from "react";

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
    className={`flex h-16 min-w-[4rem] flex-1 flex-col items-center justify-center gap-1 p-2 text-xs ${
      item.active
        ? "bg-background text-primary"
        : "text-muted-foreground hover:bg-muted/40"
    }`}
  >
    {item.icon}
    <span>{item.label}</span>
  </Link>
));

NavItemButton.displayName = 'NavItemButton';

// Original function component definition
function BottomNavigationComponent() {
  const pathname = usePathname();
  
  // Use useMemo to avoid recreating nav items on each render
  const navItems = useMemo(() => [
    {
      href: "/dashboard",
      icon: <Home size={20} />,
      label: "Home",
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/analytics",
      icon: <BarChart2 size={20} />,
      label: "Analytics",
      active: pathname.startsWith("/dashboard/analytics"),
    },
    {
      href: "/dashboard/transactions",
      icon: <FileText size={20} />,
      label: "Transactions",
      active: pathname.startsWith("/dashboard/transactions"),
    },
    {
      href: "/dashboard/budget",
      icon: <BarChart2 size={20} />,
      label: "Budget",
      active: pathname.startsWith("/dashboard/budget"),
    },
    {
      href: "/dashboard/settings",
      icon: <User size={20} />,
      label: "Profile",
      active: pathname.startsWith("/dashboard/settings"),
    },
    {
      href: "/dashboard/about",
      icon: <Info size={20} />,
      label: "About",
      active: pathname.startsWith("/dashboard/about"),
    },
  ], [pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavItemButton key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}

// Function component definition for AddTransactionButton
function AddTransactionButtonComponent({ 
  onClick 
}: { 
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      aria-label="Add Transaction"
    >
      <PlusCircle size={24} />
    </button>
  );
}

// Create memoized versions
const MemoizedBottomNavigation = memo(BottomNavigationComponent);
MemoizedBottomNavigation.displayName = 'BottomNavigation';

const MemoizedAddTransactionButton = memo(AddTransactionButtonComponent);
MemoizedAddTransactionButton.displayName = 'AddTransactionButton';

// Export both the memoized versions with the original names
export { MemoizedBottomNavigation as BottomNavigation, MemoizedAddTransactionButton as AddTransactionButton }; 
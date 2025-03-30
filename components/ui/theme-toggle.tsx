"use client";

import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useUserPreferences } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  iconOnly?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

// Memoized theme menu items to avoid re-rendering
const ThemeMenuItems = memo(function ThemeMenuItems({ 
  onSelectTheme 
}: { 
  onSelectTheme: (theme: string) => void 
}) {
  return (
    <>
      <DropdownMenuItem onClick={() => onSelectTheme("light")}>
        <Sun className="mr-2 h-4 w-4" />
        <span>Light</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelectTheme("dark")}>
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelectTheme("system")}>
        <Laptop className="mr-2 h-4 w-4" />
        <span>System</span>
      </DropdownMenuItem>
    </>
  );
});

// Define as a function component first, then create a memoized version
function ThemeToggleComponent({
  className,
  iconOnly = false,
  variant = "outline",
  size = "icon",
  align = "end",
  side = "bottom",
}: ThemeToggleProps) {
  const { theme, setTheme } = useUserPreferences();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize the theme change handler
  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
  }, [setTheme]);

  // Memoize the button content based on current theme and iconOnly prop
  const buttonContent = useMemo(() => {
    if (!mounted) {
      return (
        <>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </>
      );
    }

    if (theme === "light") {
      return (
        <>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
          {!iconOnly && <span className="ml-2">Light</span>}
          <span className="sr-only">Toggle theme</span>
        </>
      );
    }
    
    if (theme === "dark") {
      return (
        <>
          <Moon className="h-4 w-4 rotate-0 scale-100 transition-all" />
          {!iconOnly && <span className="ml-2">Dark</span>}
          <span className="sr-only">Toggle theme</span>
        </>
      );
    }
    
    return (
      <>
        <Laptop className="h-4 w-4 rotate-0 scale-100 transition-all" />
        {!iconOnly && <span className="ml-2">System</span>}
        <span className="sr-only">Toggle theme</span>
      </>
    );
  }, [theme, iconOnly, mounted]);

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={cn("w-9", className)}>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn(iconOnly ? "w-9" : "", className)}>
          {buttonContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        <ThemeMenuItems onSelectTheme={handleThemeChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Create a memoized version of ThemeToggle
const MemoizedThemeToggle = memo(ThemeToggleComponent);
MemoizedThemeToggle.displayName = 'ThemeToggle';

// Export both the memoized and original versions
export { MemoizedThemeToggle as ThemeToggle }; 
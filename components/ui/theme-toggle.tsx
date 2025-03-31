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
      <DropdownMenuItem onClick={() => onSelectTheme("light")} className="focus:bg-amber-50 dark:focus:bg-amber-950/30">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 mr-2.5 text-white">
              <Sun className="h-4 w-4" />
            </div>
            <span>Light</span>
          </div>
          <span className="text-xs text-muted-foreground">⌘+L</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelectTheme("dark")} className="focus:bg-violet-50 dark:focus:bg-violet-950/30">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mr-2.5 text-white">
              <Moon className="h-4 w-4" />
            </div>
            <span>Dark</span>
          </div>
          <span className="text-xs text-muted-foreground">⌘+D</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelectTheme("system")} className="focus:bg-blue-50 dark:focus:bg-blue-950/30">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-sky-500 mr-2.5 text-white">
              <Laptop className="h-4 w-4" />
            </div>
            <span>System</span>
          </div>
          <span className="text-xs text-muted-foreground">⌘+S</span>
        </div>
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

  // Add keyboard shortcuts 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'l') {
          e.preventDefault();
          setTheme('light');
        } else if (e.key === 'd') {
          e.preventDefault();
          setTheme('dark');
        } else if (e.key === 's') {
          e.preventDefault();
          setTheme('system');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTheme]);

  // Memoize the button content based on current theme and iconOnly prop
  const buttonContent = useMemo(() => {
    if (!mounted) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-yellow-500 dark:from-violet-500 dark:to-purple-600 opacity-0 dark:opacity-0 rounded-full transition-all duration-300"></div>
          <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-white" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-violet-500 dark:text-white" />
          <span className="sr-only">Toggle theme</span>
        </div>
      );
    }

    if (theme === "light") {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-yellow-500 opacity-15 rounded-full"></div>
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all text-amber-600" />
          {!iconOnly && <span className="ml-2 text-sm font-medium">Light</span>}
          <span className="sr-only">Light theme</span>
        </div>
      );
    }
    
    if (theme === "dark") {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-20 rounded-full"></div>
          <Moon className="h-[18px] w-[18px] rotate-0 scale-100 transition-all text-violet-300" />
          {!iconOnly && <span className="ml-2 text-sm font-medium">Dark</span>}
          <span className="sr-only">Dark theme</span>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-300 to-blue-500 opacity-15 rounded-full"></div>
        <Laptop className="h-[18px] w-[18px] rotate-0 scale-100 transition-all text-sky-600 dark:text-sky-400" />
        {!iconOnly && <span className="ml-2 text-sm font-medium">System</span>}
        <span className="sr-only">System theme</span>
      </div>
    );
  }, [theme, iconOnly, mounted]);

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size={size} 
        className={cn(
          "relative w-10 h-10 p-0 overflow-hidden rounded-full",
          "bg-background/0 hover:bg-background/0",
          "border border-border/40 hover:border-primary/50 shadow-sm",
          "transition-all duration-300 ease-in-out hover:shadow-md",
          className
        )}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-yellow-500 dark:from-violet-500 dark:to-purple-600 opacity-0 dark:opacity-0 rounded-full transition-all duration-300"></div>
          <Sun className="absolute h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-white" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-violet-500 dark:text-white" />
          <span className="sr-only">Toggle theme</span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={size} 
          className={cn(
            "relative w-10 h-10 p-0 overflow-hidden rounded-full",
            "bg-background/0 hover:bg-background/0",
            "border border-border/40 hover:border-primary/40 shadow-sm",
            "transition-all duration-300 ease-in-out hover:shadow-md hover:scale-105",
            iconOnly ? "" : "w-auto px-3",
            className
          )}
        >
          {buttonContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-56 p-2">
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
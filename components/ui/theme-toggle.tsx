"use client";

import { useEffect, useState } from "react";
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

export function ThemeToggle({
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
          {theme === "light" && (
            <>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
              {!iconOnly && <span className="ml-2">Light</span>}
            </>
          )}
          {theme === "dark" && (
            <>
              <Moon className="h-4 w-4 rotate-0 scale-100 transition-all" />
              {!iconOnly && <span className="ml-2">Dark</span>}
            </>
          )}
          {theme === "system" && (
            <>
              <Laptop className="h-4 w-4 rotate-0 scale-100 transition-all" />
              {!iconOnly && <span className="ml-2">System</span>}
            </>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
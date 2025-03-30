"use client"

import { useEffect } from 'react';
import { useUserPreferences } from '@/lib/store';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: "light" | "dark" | "system";
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ 
  children,
  attribute,
  defaultTheme,
  enableSystem,
  disableTransitionOnChange
}: ThemeProviderProps) {
  const { theme, setTheme } = useUserPreferences();
  
  useEffect(() => {
    // Handle system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        if (mediaQuery.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    // If attribute is provided (like "class"), use it instead of directly manipulating classes
    const applyTheme = () => {
      if (attribute) {
        // If attribute is "class", toggle dark class
        if (attribute === "class") {
          if (theme === "dark" || (theme === "system" && mediaQuery.matches)) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // For other attributes, set the value directly
          document.documentElement.setAttribute(
            attribute, 
            theme === "system" 
              ? (mediaQuery.matches ? "dark" : "light") 
              : theme
          );
        }
      } else {
        // Default behavior (backward compatibility)
        if (theme === "dark" || (theme === "system" && mediaQuery.matches)) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      
      // Handle transition disabling if requested
      if (disableTransitionOnChange) {
        document.documentElement.classList.add("disable-transitions");
        setTimeout(() => {
          document.documentElement.classList.remove("disable-transitions");
        }, 0);
      }
    };

    // Set initial theme
    applyTheme();

    // Listen for changes in system preference
    if (enableSystem || theme === "system") {
      mediaQuery.addEventListener("change", () => {
        handleChange();
        applyTheme();
      });
    }
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme, attribute, disableTransitionOnChange, enableSystem]);

  return <>{children}</>;
} 
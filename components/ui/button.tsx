"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-primary-gradient text-primary-foreground hover:bg-primary-gradient/95 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
        "mobile-icon": "h-11 w-11", // Larger touch target for mobile
      },
      isTouchDevice: {
        true: "touch-manipulation tap-highlight-transparent",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      isTouchDevice: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isTouchDevice, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Auto-detect touch device if not explicitly provided
    const [isTouch, setIsTouch] = React.useState(false);
    
    React.useEffect(() => {
      const isTouchDevice = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
      
      setIsTouch(isTouchDevice);
    }, []);
    
    const actualIsTouchDevice = isTouchDevice !== undefined ? isTouchDevice : isTouch;
    
    return (
      <Comp
        className={cn(buttonVariants({ 
          variant, 
          size, 
          isTouchDevice: actualIsTouchDevice,
          className 
        }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 
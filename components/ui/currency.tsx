import React from 'react';
import { useUserPreferences, formatCurrency } from '@/lib/store';

interface CurrencyProps {
  value: number;
  className?: string;
  currencyOverride?: string;
  showSign?: boolean;
  currency?: string;
}

export function Currency({ value, className, currencyOverride, showSign = false, currency }: CurrencyProps) {
  const { currency: userCurrency } = useUserPreferences();
  
  // Use the provided override, direct currency prop, or fall back to the user's preference
  const activeCurrency = currencyOverride || currency || userCurrency;
  
  // Format with sign if requested
  const formattedValue = formatCurrency(value, activeCurrency);
  const displayValue = showSign && value > 0 ? `+${formattedValue}` : formattedValue;
  
  return (
    <span className={className}>
      {displayValue}
    </span>
  );
}

// For server components or non-React contexts
export function formatAmount(amount: number, currencyCode?: string) {
  return formatCurrency(amount, currencyCode);
} 
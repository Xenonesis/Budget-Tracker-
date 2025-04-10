/**
 * Format a number as currency
 * @param amount The amount to format
 * @param abbreviated Whether to show an abbreviated format
 * @returns The formatted currency string
 */
export const formatCurrency = (amount: number, abbreviated: boolean | string = false): string => {
  // Handle undefined, null, or NaN inputs
  if (amount === undefined || amount === null || isNaN(amount)) {
    return abbreviated ? '$0' : '$0.00';
  }
  
  // Import dynamically to avoid server-side rendering issues
  let currency = 'USD';
  if (typeof window !== 'undefined') {
    // First try to get from localStorage for consistency with the main store
    currency = localStorage.getItem('budget-currency') || 'USD';
  }
  
  if (abbreviated) {
    // Use the correct currency symbol
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const symbol = formatter.format(0).replace(/0/g, '').trim();
    
    if (amount === 0) return `${symbol}0`;
    if (Math.abs(amount) >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`;
    return `${symbol}${amount.toFixed(0)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}; 
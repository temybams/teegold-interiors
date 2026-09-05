const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** Display only — the server stays the authority on what a line actually costs. */
export const formatNaira = (amount: number): string => nairaFormatter.format(amount);

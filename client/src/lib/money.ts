const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** `85000` -> `"₦85,000"` */
export const formatNaira = (amount: number): string => nairaFormatter.format(amount);

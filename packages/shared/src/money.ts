/**
 * Money helpers. Amounts are plain numbers of Naira; invoices in this business
 * are always whole Naira, so display rounds to zero decimals.
 */

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 0,
});

/** `85000` -> `"₦85,000"` */
export const formatNaira = (amount: number): string => nairaFormatter.format(amount);

/** `85000` -> `"85,000"` for table cells that already show ₦ in the column header */
export const formatAmount = (amount: number): string => plainFormatter.format(amount);

/** Rounds to `decimals` places without floating point drift, e.g. `roundTo(2.005, 2) === 2.01` */
export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/** Money is stored and compared to the Naira, never to fractions of a kobo. */
export const roundMoney = (value: number): number => roundTo(value, 2);

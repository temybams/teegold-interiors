/**
 * Amounts are plain numbers of Naira. Invoices in this business are whole Naira,
 * so display rounds to zero decimals while stored values keep two.
 */

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** `85000` -> `"₦85,000"` */
export const formatNaira = (amount: number): string => nairaFormatter.format(amount);

/** Rounds without floating point drift, e.g. `roundTo(2.005, 2) === 2.01` */
export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const roundMoney = (value: number): number => roundTo(value, 2);

import { roundMoney, roundTo } from './money';

export const PRICING_TYPES = ['PER_M2', 'PER_PIECE', 'PER_SERVICE', 'PER_ROLL'] as const;

export type PricingType = (typeof PRICING_TYPES)[number];

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  PER_M2: 'Per m²',
  PER_PIECE: 'Per piece',
  PER_SERVICE: 'Per service',
  PER_ROLL: 'Per roll',
};

/** Only measured products ask for width and height; everything else asks for quantity. */
export const isMeasured = (pricingType: PricingType): boolean => pricingType === 'PER_M2';

/** Window blinds: `1.0 × 2.0` metres becomes the `2.00` that shows under quantity. */
export const calculateArea = (widthMetres: number, heightMetres: number): number =>
  roundTo(widthMetres * heightMetres, 2);

export type LineTotalInput = {
  pricingType: PricingType;
  unitPrice: number;
  /** Required for PER_M2 lines */
  width?: number | null;
  /** Required for PER_M2 lines */
  height?: number | null;
  /** Required for every other pricing type */
  quantity?: number | null;
};

/** The single source of truth for a line's billable quantity (area in m², or piece count). */
export const calculateQuantity = (input: LineTotalInput): number => {
  if (isMeasured(input.pricingType)) {
    return calculateArea(input.width ?? 0, input.height ?? 0);
  }

  return input.quantity ?? 0;
};

export const calculateLineTotal = (input: LineTotalInput): number =>
  roundMoney(calculateQuantity(input) * input.unitPrice);

export type InvoiceTotalsInput = {
  lineTotals: number[];
  discount?: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  total: number;
};

export const calculateTotals = ({
  lineTotals,
  discount = 0,
}: InvoiceTotalsInput): InvoiceTotals => {
  const subtotal = roundMoney(lineTotals.reduce((sum, lineTotal) => sum + lineTotal, 0));
  const appliedDiscount = roundMoney(Math.min(Math.max(discount, 0), subtotal));

  return {
    subtotal,
    discount: appliedDiscount,
    total: roundMoney(subtotal - appliedDiscount),
  };
};

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

export type LineInput = {
  pricingType: PricingType;
  unitPrice: number;
  width?: number | null;
  height?: number | null;
  quantity?: number | null;
};

/** The billable quantity of a line: area in m² for blinds, piece count for everything else. */
export const calculateQuantity = (line: LineInput): number =>
  isMeasured(line.pricingType)
    ? calculateArea(line.width ?? 0, line.height ?? 0)
    : (line.quantity ?? 0);

export const calculateLineTotal = (line: LineInput): number =>
  roundMoney(calculateQuantity(line) * line.unitPrice);

export type Totals = {
  subtotal: number;
  discount: number;
  total: number;
};

/** A discount can never exceed the subtotal, so a total can never go negative. */
export const calculateTotals = (lineTotals: number[], discount = 0): Totals => {
  const subtotal = roundMoney(lineTotals.reduce((sum, lineTotal) => sum + lineTotal, 0));
  const appliedDiscount = roundMoney(Math.min(Math.max(discount, 0), subtotal));

  return {
    subtotal,
    discount: appliedDiscount,
    total: roundMoney(subtotal - appliedDiscount),
  };
};

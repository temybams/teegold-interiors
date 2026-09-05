/**
 * Copied into the client so catalogue and invoice forms do not depend on
 * Webpack reading named exports out of the CommonJS `@teegold/shared` build.
 * The server still uses the shared package as the authority when saving.
 */

export const PRICING_TYPES = ['PER_M2', 'PER_PIECE', 'PER_SERVICE', 'PER_ROLL'] as const;

export type PricingType = (typeof PRICING_TYPES)[number];

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  PER_M2: 'Per m²',
  PER_PIECE: 'Per piece',
  PER_SERVICE: 'Per service',
  PER_ROLL: 'Per roll',
};

export const PRODUCT_CATEGORIES = ['Window Blinds', 'Curtains', 'Accessories', 'Services'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const isMeasured = (pricingType: PricingType): boolean => pricingType === 'PER_M2';

export const calculateArea = (widthMetres: number, heightMetres: number): number =>
  Math.round((widthMetres * heightMetres + Number.EPSILON) * 100) / 100;

export type LineInput = {
  pricingType: PricingType;
  unitPrice: number;
  width?: number | null;
  height?: number | null;
  quantity?: number | null;
};

export const calculateQuantity = (line: LineInput): number =>
  isMeasured(line.pricingType)
    ? calculateArea(line.width ?? 0, line.height ?? 0)
    : (line.quantity ?? 0);

export const calculateLineTotal = (line: LineInput): number =>
  Math.round((calculateQuantity(line) * line.unitPrice + Number.EPSILON) * 100) / 100;

export const calculateTotals = (lineTotals: number[], discount = 0) => {
  const subtotal = Math.round(lineTotals.reduce((sum, value) => sum + value, 0));
  const applied = Math.min(Math.max(Math.round(discount), 0), subtotal);

  return {
    subtotal,
    discount: applied,
    total: subtotal - applied,
  };
};

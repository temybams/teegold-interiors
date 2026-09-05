export const PRICING_TYPES = ['PER_M2', 'PER_PIECE', 'PER_SERVICE', 'PER_ROLL'] as const;

export type PricingType = (typeof PRICING_TYPES)[number];

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  PER_M2: 'Per m²',
  PER_PIECE: 'Per piece',
  PER_SERVICE: 'Per service',
  PER_ROLL: 'Per roll',
};

export const isMeasured = (pricingType: PricingType): boolean => pricingType === 'PER_M2';

/**
 * Instant feedback while someone types width and height. Pure geometry only —
 * money is left to the server so there is one authority on what a line costs.
 */
export const calculateArea = (widthMetres: number, heightMetres: number): number =>
  Math.round((widthMetres * heightMetres + Number.EPSILON) * 100) / 100;

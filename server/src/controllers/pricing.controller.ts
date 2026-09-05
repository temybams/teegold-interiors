import type { RequestHandler } from 'express';

import { formatNaira } from '../utils/money';
import { calculateLineTotal, calculateQuantity, isMeasured } from '../utils/pricing';
import type { PreviewLineInput } from '../validations/pricing.validation';

/**
 * Lets the invoice form ask the server what a line comes to, so the figure a staff
 * member sees while typing is the same figure that will be saved.
 */
export const previewLine: RequestHandler = (req, res) => {
  const line = req.body as PreviewLineInput;
  const measured = isMeasured(line.pricingType);
  const quantity = calculateQuantity(line);
  const lineTotal = calculateLineTotal(line);

  res.json({
    measured,
    quantity,
    unit: measured ? 'm²' : 'qty',
    lineTotal,
    lineTotalFormatted: formatNaira(lineTotal),
  });
};

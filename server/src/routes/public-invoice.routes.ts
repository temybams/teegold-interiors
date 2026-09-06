import { Router } from 'express';

import { getPublicInvoice, getPublicInvoicePdf } from '../controllers/invoice.controller';
import { invoiceTokenParamsSchema } from '../validations/invoice.validation';
import { validate } from '../validations/validate';

export const publicInvoiceRouter = Router();

publicInvoiceRouter.get('/:token', validate({ params: invoiceTokenParamsSchema }), getPublicInvoice);
publicInvoiceRouter.get(
  '/:token/pdf',
  validate({ params: invoiceTokenParamsSchema }),
  getPublicInvoicePdf,
);

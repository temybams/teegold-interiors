import { Router } from 'express';

import {
  getInvoiceById,
  getInvoicePdf,
  getInvoiceShare,
  getInvoices,
  patchInvoice,
  patchInvoiceCancel,
  patchInvoicePayment,
  postInvoice,
  postInvoiceEmail,
} from '../controllers/invoice.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  invoiceBodySchema,
  invoiceEmailBodySchema,
  invoiceIdParamsSchema,
  invoiceListQuerySchema,
  invoicePaymentBodySchema,
} from '../validations/invoice.validation';
import { validate } from '../validations/validate';

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);

invoiceRouter.get('/', validate({ query: invoiceListQuerySchema }), getInvoices);
invoiceRouter.post('/', validate({ body: invoiceBodySchema }), postInvoice);
invoiceRouter.get('/:id', validate({ params: invoiceIdParamsSchema }), getInvoiceById);
invoiceRouter.get('/:id/pdf', validate({ params: invoiceIdParamsSchema }), getInvoicePdf);
invoiceRouter.get('/:id/share', validate({ params: invoiceIdParamsSchema }), getInvoiceShare);
invoiceRouter.post(
  '/:id/email',
  validate({ params: invoiceIdParamsSchema, body: invoiceEmailBodySchema }),
  postInvoiceEmail,
);
invoiceRouter.patch(
  '/:id',
  validate({ params: invoiceIdParamsSchema, body: invoiceBodySchema }),
  patchInvoice,
);
invoiceRouter.patch(
  '/:id/payment',
  validate({ params: invoiceIdParamsSchema, body: invoicePaymentBodySchema }),
  patchInvoicePayment,
);
invoiceRouter.patch(
  '/:id/cancel',
  validate({ params: invoiceIdParamsSchema }),
  patchInvoiceCancel,
);

import { Router } from 'express';

import { getPublicQuotation, getPublicQuotationPdf } from '../controllers/quotation.controller';
import { quotationTokenParamsSchema } from '../validations/quotation.validation';
import { validate } from '../validations/validate';

export const publicQuotationRouter = Router();

publicQuotationRouter.get(
  '/:token',
  validate({ params: quotationTokenParamsSchema }),
  getPublicQuotation,
);
publicQuotationRouter.get(
  '/:token/pdf',
  validate({ params: quotationTokenParamsSchema }),
  getPublicQuotationPdf,
);

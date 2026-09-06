import { Router } from 'express';

import {
  getQuotationById,
  getQuotationPdf,
  getQuotationShare,
  getQuotations,
  patchQuotation,
  patchQuotationCancel,
  postQuotation,
  postQuotationConvert,
} from '../controllers/quotation.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  quotationBodySchema,
  quotationIdParamsSchema,
  quotationListQuerySchema,
} from '../validations/quotation.validation';
import { validate } from '../validations/validate';

export const quotationRouter = Router();

quotationRouter.use(requireAuth);

quotationRouter.get('/', validate({ query: quotationListQuerySchema }), getQuotations);
quotationRouter.post('/', validate({ body: quotationBodySchema }), postQuotation);
quotationRouter.get('/:id', validate({ params: quotationIdParamsSchema }), getQuotationById);
quotationRouter.get('/:id/pdf', validate({ params: quotationIdParamsSchema }), getQuotationPdf);
quotationRouter.get('/:id/share', validate({ params: quotationIdParamsSchema }), getQuotationShare);
quotationRouter.patch(
  '/:id',
  validate({ params: quotationIdParamsSchema, body: quotationBodySchema }),
  patchQuotation,
);
quotationRouter.patch(
  '/:id/cancel',
  validate({ params: quotationIdParamsSchema }),
  patchQuotationCancel,
);
quotationRouter.post(
  '/:id/convert',
  validate({ params: quotationIdParamsSchema }),
  postQuotationConvert,
);

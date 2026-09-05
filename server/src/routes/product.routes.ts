import { Router } from 'express';

import {
  getProducts,
  patchProduct,
  patchProductActive,
  postProduct,
} from '../controllers/product.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  productBodySchema,
  productIdParamsSchema,
  productListQuerySchema,
  setProductActiveSchema,
} from '../validations/product.validation';
import { validate } from '../validations/validate';

export const productRouter = Router();

productRouter.use(requireAuth);

productRouter.get('/', validate({ query: productListQuerySchema }), getProducts);

productRouter.post('/', requireRole('ADMIN'), validate({ body: productBodySchema }), postProduct);
productRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: productIdParamsSchema, body: productBodySchema }),
  patchProduct,
);
productRouter.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validate({ params: productIdParamsSchema, body: setProductActiveSchema }),
  patchProductActive,
);

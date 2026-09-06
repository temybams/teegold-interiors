import { Router } from 'express';

import { getCategories, patchCategory, postCategory } from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  categoryBodySchema,
  categoryIdParamsSchema,
  categoryListQuerySchema,
  categoryUpdateSchema,
} from '../validations/category.validation';
import { validate } from '../validations/validate';

export const categoryRouter = Router();

categoryRouter.use(requireAuth);

categoryRouter.get('/', validate({ query: categoryListQuerySchema }), getCategories);
categoryRouter.post('/', requireRole('ADMIN'), validate({ body: categoryBodySchema }), postCategory);
categoryRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: categoryIdParamsSchema, body: categoryUpdateSchema }),
  patchCategory,
);

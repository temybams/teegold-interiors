import { Router } from 'express';

import {
  getCustomerById,
  getCustomers,
  patchCustomer,
  postCustomer,
} from '../controllers/customer.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  customerBodySchema,
  customerIdParamsSchema,
  customerListQuerySchema,
} from '../validations/customer.validation';
import { validate } from '../validations/validate';

export const customerRouter = Router();

customerRouter.use(requireAuth);

customerRouter.get('/', validate({ query: customerListQuerySchema }), getCustomers);
customerRouter.get('/:id', validate({ params: customerIdParamsSchema }), getCustomerById);
customerRouter.post('/', validate({ body: customerBodySchema }), postCustomer);
customerRouter.patch(
  '/:id',
  validate({ params: customerIdParamsSchema, body: customerBodySchema }),
  patchCustomer,
);

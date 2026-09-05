import { Router } from 'express';

import { authRouter } from './auth.routes';
import { customerRouter } from './customer.routes';
import { healthRouter } from './health.routes';
import { invoiceRouter } from './invoice.routes';
import { pricingRouter } from './pricing.routes';
import { productRouter } from './product.routes';
import { publicInvoiceRouter } from './public-invoice.routes';
import { userRouter } from './user.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/public/invoices', publicInvoiceRouter);
apiRouter.use('/pricing', pricingRouter);

import { Router } from 'express';

import { authRouter } from './auth.routes';
import { categoryRouter } from './category.routes';
import { customerRouter } from './customer.routes';
import { dashboardRouter } from './dashboard.routes';
import { healthRouter } from './health.routes';
import { invoiceRouter } from './invoice.routes';
import { pricingRouter } from './pricing.routes';
import { productRouter } from './product.routes';
import { publicInvoiceRouter } from './public-invoice.routes';
import { settingsRouter } from './settings.routes';
import { userRouter } from './user.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/public/invoices', publicInvoiceRouter);
apiRouter.use('/pricing', pricingRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/dashboard', dashboardRouter);

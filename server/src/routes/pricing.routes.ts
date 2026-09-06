import { Router } from 'express';

import { previewLine } from '../controllers/pricing.controller';
import { validate } from '../validations/validate';
import { previewLineSchema } from '../validations/pricing.validation';

export const pricingRouter = Router();

pricingRouter.post('/preview', validate({ body: previewLineSchema }), previewLine);

import { Router } from 'express';

import { getSettings, patchSettings } from '../controllers/settings.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { settingsBodySchema } from '../validations/settings.validation';
import { validate } from '../validations/validate';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', getSettings);
settingsRouter.patch('/', requireRole('ADMIN'), validate({ body: settingsBodySchema }), patchSettings);

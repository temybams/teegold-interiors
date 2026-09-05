import { Router } from 'express';

import { getMe, postLogin, postLogout } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { loginSchema } from '../validations/auth.validation';
import { validate } from '../validations/validate';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema }), postLogin);
authRouter.post('/logout', postLogout);
authRouter.get('/me', requireAuth, getMe);

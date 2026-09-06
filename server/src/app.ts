import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, isProduction } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { apiRouter } from './routes';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  // Render (and most PaaS) terminate TLS in front of Node. Needed for secure cookies
  // and accurate rate-limit IPs.
  if (isProduction) {
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.use('/api', apiRouter);

  // Order matters: unmatched routes become 404s, then everything lands in the error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

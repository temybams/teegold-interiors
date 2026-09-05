import rateLimit from 'express-rate-limit';

/** Five tries is enough for a typo. After that, wait. */
export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many attempts. Try again in 15 minutes.',
      code: 'TOO_MANY_ATTEMPTS',
    },
  },
});

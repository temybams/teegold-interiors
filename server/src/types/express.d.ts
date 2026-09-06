import type { Role } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`; absent on public routes. */
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
      };
    }
  }
}

import type { auth } from '../auth';

type BetterAuthSession = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      user: BetterAuthSession['user'];
      session: BetterAuthSession['session'];
    }
  }
}

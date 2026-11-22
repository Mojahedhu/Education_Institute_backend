import type { auth } from "./lib/auth.js";

type AuthUser = typeof auth.$Infer.Session.user;
type AuthSession = typeof auth.$Infer.Session.session;

declare global {
  namespace Express {
    interface Request {
      user?: Omit<AuthUser, "role"> & {
        role: UserRole;
      };
      session?: AuthSession;
    }
  }
}

export {};

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { HttpError } from "./error-handler.js";

/**
 * Ensures user is authenticated via Better Auth session
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const validRoles: UserRole[] = ["admin", "teacher", "student"];
    const role = session?.user.role as UserRole;

    if (!session || !validRoles.includes(role)) {
      throw new HttpError(401, "Unauthorized: Authentication required");
    }

    req.user = {
      ...session.user,
      role: role,
    };
    req.session = session.session;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Restricts access to specific roles (e.g. "admin")
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(new HttpError(403, "Forbidden: Insufficient permissions"));
    }

    next();
  };
}

// // Public / Read-only routes
// subjectRouter.get("/", getSubjects);
// subjectRouter.get("/:id", getSubjectDetails);
// subjectRouter.get("/:id/classes", getSubjectClasses);
// subjectRouter.get("/:id/users", getSubjectUsers);
// // Protected: Only authenticated admins can create subjects
// subjectRouter.post("/", requireAuth, requireRole("admin"), createSubject);

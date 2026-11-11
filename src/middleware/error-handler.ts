import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

/** Throw this from controllers/services to send a specific status + message. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// Express 5 forwards rejected promises from async handlers to this middleware
// on its own, so no asyncHandler wrapper is needed.

// Postgres SQLSTATE codes we translate into HTTP responses.
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

// Newer drizzle versions wrap the driver error in `cause`, so check both places.
function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

// Errors raised by Express itself (e.g. body-parser: malformed JSON, payload
// too large) are http-errors objects that carry a 4xx `status` and `expose`.
// Without this they would fall through to the 500 branch.
function clientError(
  error: unknown,
): { status: number; message: string } | null {
  const e = error as {
    status?: unknown;
    statusCode?: unknown;
    expose?: unknown;
    message?: unknown;
  } | null;

  const status = e?.status ?? e?.statusCode;
  if (typeof status !== "number" || status < 400 || status >= 500) return null;

  const message =
    e?.expose === true && typeof e.message === "string"
      ? e.message
      : "Bad request";

  return { status, message };
}

// Must be registered after all routes: app.use(errorHandler)
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // If the response has already started, only Express's default handler can
  // safely close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const pgCode = pgErrorCode(err);

  if (pgCode === PG_UNIQUE_VIOLATION) {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }

  // e.g. creating a subject with a departmentId that doesn't exist. The
  // constraint/table names from the driver are deliberately not echoed back.
  if (pgCode === PG_FOREIGN_KEY_VIOLATION) {
    res.status(400).json({ error: "Referenced resource does not exist" });
    return;
  }

  const client = clientError(err);
  if (client) {
    res.status(client.status).json({ error: client.message });
    return;
  }

  console.error(`${req.method} ${req.originalUrl} error:`, err);
  res.status(500).json({ error: "Internal server error" });
};

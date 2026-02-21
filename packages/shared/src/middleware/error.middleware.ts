import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import type { ApiError } from '../types';

// ── Global Error Handler ──────────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiError = {
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    };
    res.status(422).json(response);
    return;
  }

  // HTTP errors (from http-errors package)
  if (isHttpError(err)) {
    const response: ApiError = {
      success: false,
      error: err.message,
      code: `HTTP_${err.status}`,
    };
    res.status(err.status).json(response);
    return;
  }

  // Supabase PostgreSQL errors
  if (isSupabaseError(err)) {
    const pgError = err as SupabaseError;
    let status = 500;
    let message = 'Database error';

    switch (pgError.code) {
      case '23505': // unique_violation
        status = 409;
        message = 'Resource already exists';
        break;
      case '23503': // foreign_key_violation
        status = 400;
        message = 'Referenced resource not found';
        break;
      case '42501': // insufficient_privilege
        status = 403;
        message = 'Insufficient privileges';
        break;
    }

    res.status(status).json({ success: false, error: message, code: pgError.code });
    return;
  }

  // Generic fallback
  const response: ApiError = {
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(err),
    code: 'INTERNAL_ERROR',
  };
  res.status(500).json(response);
}

// ── Request Validator ─────────────────────────────────────────────────────────

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure, throws a 422 Zod error caught by errorHandler.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Record<string, string>;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ── Request Logger ────────────────────────────────────────────────────────────

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id ?? 'anonymous';
    console.log(
      `[${new Date().toISOString()}] ${method} ${path} ${res.statusCode} ${duration}ms — user:${userId} ip:${ip}`
    );
  });

  next();
}

// ── Type Guards ───────────────────────────────────────────────────────────────

interface HttpError {
  status: number;
  message: string;
  isHttpError?: boolean;
}

interface SupabaseError {
  code: string;
  message: string;
  details?: string;
}

function isHttpError(err: unknown): err is HttpError {
  return typeof err === 'object' && err !== null && 'status' in err && 'message' in err;
}

function isSupabaseError(err: unknown): err is SupabaseError {
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
}

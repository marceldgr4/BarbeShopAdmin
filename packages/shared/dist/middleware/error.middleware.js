"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.requestLogger = requestLogger;
const zod_1 = require("zod");
// ── Global Error Handler ──────────────────────────────────────────────────────
function errorHandler(err, req, res, _next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const response = {
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
        const response = {
            success: false,
            error: err.message,
            code: `HTTP_${err.status}`,
        };
        res.status(err.status).json(response);
        return;
    }
    // Supabase PostgreSQL errors
    if (isSupabaseError(err)) {
        const pgError = err;
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
    const response = {
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
function validateBody(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
/**
 * Middleware factory that validates req.query against a Zod schema.
 */
function validateQuery(schema) {
    return (req, _res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
// ── Request Logger ────────────────────────────────────────────────────────────
function requestLogger(req, res, next) {
    const start = Date.now();
    const { method, path, ip } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const userId = req.user?.id ?? 'anonymous';
        console.log(`[${new Date().toISOString()}] ${method} ${path} ${res.statusCode} ${duration}ms — user:${userId} ip:${ip}`);
    });
    next();
}
function isHttpError(err) {
    return typeof err === 'object' && err !== null && 'status' in err && 'message' in err;
}
function isSupabaseError(err) {
    return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
}
//# sourceMappingURL=error.middleware.js.map
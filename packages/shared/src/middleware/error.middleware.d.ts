import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void;
/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure, throws a 422 Zod error caught by errorHandler.
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map
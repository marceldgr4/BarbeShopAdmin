import { Request, Response } from 'express';
import type { PaginationQuery } from '../types';
export declare function ok<T>(res: Response, data: T, message?: string, status?: number): void;
export declare function created<T>(res: Response, data: T): void;
export declare function noContent(res: Response): void;
export declare function paginated<T>(res: Response, data: T[], total: number, query: PaginationQuery): void;
export declare function parsePagination(query: Record<string, unknown>): {
    page: number;
    limit: number;
    offset: number;
};
type AuditAction = 'create' | 'update' | 'delete' | 'status_change';
interface AuditLogEntry {
    user_id: string;
    action: AuditAction;
    resource: string;
    resource_id: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    ip_address?: string;
}
/**
 * Records admin operations to the audit_logs table (RF24).
 * Non-blocking — failures are logged but don't interrupt the request.
 */
export declare function auditLog(req: Request, entry: Omit<AuditLogEntry, 'user_id' | 'ip_address'>): Promise<void>;
/**
 * Applies standard pagination to a Supabase query builder.
 */
export declare function applyPagination<T>(query: T & {
    range: (from: number, to: number) => T;
}, offset: number, limit: number): T;
export {};
//# sourceMappingURL=index.d.ts.map
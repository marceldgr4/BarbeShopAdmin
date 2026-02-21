import { Request, Response } from 'express';
import type { ApiResponse, PaginatedResponse, PaginationQuery } from '../types';
import { getSupabaseAdmin } from '../supabase/client';

// ── Response Helpers ──────────────────────────────────────────────────────────

export function ok<T>(res: Response, data: T, message?: string, status = 200): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(status).json(response);
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 'Created successfully', 201);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  query: PaginationQuery
): void {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
  res.status(200).json(response);
}

// ── Pagination Helpers ────────────────────────────────────────────────────────

export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ── Audit Logging ─────────────────────────────────────────────────────────────

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
export async function auditLog(req: Request, entry: Omit<AuditLogEntry, 'user_id' | 'ip_address'>): Promise<void> {
  if (!req.user) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('audit_logs').insert({
    ...entry,
    user_id: req.user.id,
    ip_address: req.ip,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[AuditLog] Failed to write audit log:', error.message);
  }
}

// ── Supabase Query Helpers ────────────────────────────────────────────────────

/**
 * Applies standard pagination to a Supabase query builder.
 */
export function applyPagination<T>(
  query: T & { range: (from: number, to: number) => T },
  offset: number,
  limit: number
): T {
  return query.range(offset, offset + limit - 1);
}

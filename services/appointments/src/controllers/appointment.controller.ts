import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, ok, paginated, parsePagination, auditLog } from '@barbershop/shared';
import type { AppointmentStatus } from '@barbershop/shared';
import { z } from 'zod';

const listAppointmentsSchema = z.object({
  page:          z.coerce.number().positive().default(1),
  limit:         z.coerce.number().min(1).max(100).default(20),
  branch_id: z.string().uuid().optional(),
  barber_id:     z.string().uuid().optional(),
  client_id:     z.string().uuid().optional(),
  status:        z.enum(['pending','confirmed','in_progress','completed','cancelled','no_show']).optional(),
  date_from:     z.string().optional(),
  date_to:       z.string().optional(),
  sort_by:       z.enum(['scheduled_at', 'created_at', 'status']).default('scheduled_at'),
  sort_order:    z.enum(['asc', 'desc']).default('asc'),
});

const TABLE = 'appointments';

// ── List Appointments ─────────────────────────────────────────────────────────

export async function listAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listAppointmentsSchema.parse(req.query);
    const { page, limit, offset } = parsePagination(req.query);
    const supabase = getSupabaseAdmin();

    let dbQuery = supabase
      .from(TABLE)
      .select(`
        *,
        barbers (name),
        branches (name),
        services (name, price)
      `, { count: 'exact' })
      .order('appointment_date', { ascending: query.sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (query.branch_id) dbQuery = dbQuery.eq('branch_id', query.branch_id);
    if (query.barber_id)     dbQuery = dbQuery.eq('barber_id', query.barber_id);
    if (query.client_id)     dbQuery = dbQuery.eq('user_id', query.client_id);
    // if (query.status)        dbQuery = dbQuery.eq('status_id', query.status); // needs status mapping
    if (query.date_from)     dbQuery = dbQuery.gte('appointment_date', query.date_from);
    if (query.date_to)       dbQuery = dbQuery.lte('appointment_date', query.date_to);

    const { data, error, count } = await dbQuery;
    if (error) throw error;

    paginated(res, data ?? [], count ?? 0, { page, limit });
  } catch (err) {
    next(err);
  }
}

// ── Get Single Appointment ────────────────────────────────────────────────────

export async function getAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Update Status ─────────────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.enum(['pending','confirmed','in_progress','completed','cancelled','no_show']),
  cancellation_reason: z.string().max(500).optional(),
});

export async function updateAppointmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = updateStatusSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current } = await supabase.from(TABLE).select('status').eq('id', id).single();
    if (!current) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    // Validate status transitions
    const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      pending:     ['confirmed', 'cancelled'],
      confirmed:   ['in_progress', 'cancelled', 'no_show'],
      in_progress: ['completed', 'cancelled'],
      completed:   [],
      cancelled:   [],
      no_show:     [],
    };

    const allowed = allowedTransitions[current.status as AppointmentStatus] ?? [];
    if (!allowed.includes(body.status as AppointmentStatus)) {
      res.status(422).json({
        success: false,
        error: `Cannot transition from "${current.status}" to "${body.status}"`,
        allowed_transitions: allowed,
      });
      return;
    }

    const updatePayload: Record<string, unknown> = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.status === 'cancelled') {
      updatePayload.cancellation_reason = body.cancellation_reason ?? 'Cancelled by admin';
      updatePayload.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditLog(req, {
      action: 'status_change',
      resource: TABLE,
      resource_id: id,
      old_value: { status: current.status },
      new_value: { status: body.status },
    });

    ok(res, data, `Appointment status updated to ${body.status}`);
  } catch (err) {
    next(err);
  }
}

// ── Today's Agenda ────────────────────────────────────────────────────────────

export async function getTodayAgenda(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { branch_id, barber_id } = req.query as Record<string, string>;
    const supabase = getSupabaseAdmin();

    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('appointment_date', today)
      .order('appointment_time');

    if (branch_id) query = query.eq('branch_id', branch_id);
    if (barber_id)     query = query.eq('barber_id', barber_id);

    const { data, error } = await query;
    if (error) throw error;

    ok(res, {
      date: today,
      total: data?.length ?? 0,
      appointments: data ?? [],
    });
  } catch (err) {
    next(err);
  }
}

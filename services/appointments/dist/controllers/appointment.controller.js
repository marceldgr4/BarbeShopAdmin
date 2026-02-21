"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAppointments = listAppointments;
exports.getAppointment = getAppointment;
exports.updateAppointmentStatus = updateAppointmentStatus;
exports.getTodayAgenda = getTodayAgenda;
const shared_1 = require("@barbershop/shared");
const zod_1 = require("zod");
const listAppointmentsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().positive().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    branch_id: zod_1.z.string().uuid().optional(),
    barber_id: zod_1.z.string().uuid().optional(),
    client_id: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
    date_from: zod_1.z.string().optional(),
    date_to: zod_1.z.string().optional(),
    sort_by: zod_1.z.enum(['scheduled_at', 'created_at', 'status']).default('scheduled_at'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
const TABLE = 'appointments';
// ── List Appointments ─────────────────────────────────────────────────────────
async function listAppointments(req, res, next) {
    try {
        const query = listAppointmentsSchema.parse(req.query);
        const { page, limit, offset } = (0, shared_1.parsePagination)(req.query);
        const supabase = (0, shared_1.getSupabaseAdmin)();
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
        if (query.branch_id)
            dbQuery = dbQuery.eq('branch_id', query.branch_id);
        if (query.barber_id)
            dbQuery = dbQuery.eq('barber_id', query.barber_id);
        if (query.client_id)
            dbQuery = dbQuery.eq('user_id', query.client_id);
        // if (query.status)        dbQuery = dbQuery.eq('status_id', query.status); // needs status mapping
        if (query.date_from)
            dbQuery = dbQuery.gte('appointment_date', query.date_from);
        if (query.date_to)
            dbQuery = dbQuery.lte('appointment_date', query.date_to);
        const { data, error, count } = await dbQuery;
        if (error)
            throw error;
        (0, shared_1.paginated)(res, data ?? [], count ?? 0, { page, limit });
    }
    catch (err) {
        next(err);
    }
}
// ── Get Single Appointment ────────────────────────────────────────────────────
async function getAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            res.status(404).json({ success: false, error: 'Appointment not found' });
            return;
        }
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Update Status ─────────────────────────────────────────────────────────────
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
    cancellation_reason: zod_1.z.string().max(500).optional(),
});
async function updateAppointmentStatus(req, res, next) {
    try {
        const { id } = req.params;
        const body = updateStatusSchema.parse(req.body);
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: current } = await supabase.from(TABLE).select('status').eq('id', id).single();
        if (!current) {
            res.status(404).json({ success: false, error: 'Appointment not found' });
            return;
        }
        // Validate status transitions
        const allowedTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['in_progress', 'cancelled', 'no_show'],
            in_progress: ['completed', 'cancelled'],
            completed: [],
            cancelled: [],
            no_show: [],
        };
        const allowed = allowedTransitions[current.status] ?? [];
        if (!allowed.includes(body.status)) {
            res.status(422).json({
                success: false,
                error: `Cannot transition from "${current.status}" to "${body.status}"`,
                allowed_transitions: allowed,
            });
            return;
        }
        const updatePayload = {
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
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, {
            action: 'status_change',
            resource: TABLE,
            resource_id: id,
            old_value: { status: current.status },
            new_value: { status: body.status },
        });
        (0, shared_1.ok)(res, data, `Appointment status updated to ${body.status}`);
    }
    catch (err) {
        next(err);
    }
}
// ── Today's Agenda ────────────────────────────────────────────────────────────
async function getTodayAgenda(req, res, next) {
    try {
        const { branch_id, barber_id } = req.query;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const today = new Date().toISOString().split('T')[0];
        let query = supabase
            .from(TABLE)
            .select('*')
            .eq('appointment_date', today)
            .order('appointment_time');
        if (branch_id)
            query = query.eq('branch_id', branch_id);
        if (barber_id)
            query = query.eq('barber_id', barber_id);
        const { data, error } = await query;
        if (error)
            throw error;
        (0, shared_1.ok)(res, {
            date: today,
            total: data?.length ?? 0,
            appointments: data ?? [],
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=appointment.controller.js.map
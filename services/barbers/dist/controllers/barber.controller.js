"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBarbers = listBarbers;
exports.getBarber = getBarber;
exports.createBarber = createBarber;
exports.updateBarber = updateBarber;
exports.toggleBarberActive = toggleBarberActive;
exports.getBarberStats = getBarberStats;
exports.deleteBarber = deleteBarber;
const shared_1 = require("@barbershop/shared");
const TABLE = 'barbers';
// ── List ──────────────────────────────────────────────────────────────────────
async function listBarbers(req, res, next) {
    try {
        const query = req.query;
        const { page, limit, offset } = (0, shared_1.parsePagination)(req.query);
        const supabase = (0, shared_1.getSupabaseAdmin)();
        let dbQuery = supabase
            .from(TABLE)
            .select('*, branches(name)', { count: 'exact' })
            .order(query.sort_by ?? 'created_at', { ascending: query.sort_order === 'asc' })
            .range(offset, offset + limit - 1);
        if (query.branch_id) {
            dbQuery = dbQuery.eq('branch_id', query.branch_id);
        }
        if (query.search) {
            dbQuery = dbQuery.ilike('name', `%${query.search}%`);
        }
        if (query.is_active !== undefined) {
            dbQuery = dbQuery.eq('is_active', query.is_active === 'true');
        }
        const { data, error, count } = await dbQuery;
        if (error)
            throw error;
        (0, shared_1.paginated)(res, data ?? [], count ?? 0, { page, limit });
    }
    catch (err) {
        next(err);
    }
}
// ── Get By ID ─────────────────────────────────────────────────────────────────
async function getBarber(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*, branches(id, name, address)')
            .eq('id', id)
            .single();
        if (error || !data) {
            res.status(404).json({ success: false, error: 'Barber not found' });
            return;
        }
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Create ────────────────────────────────────────────────────────────────────
async function createBarber(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: shop } = await supabase
            .from('branches')
            .select('id')
            .eq('id', body.branch_id)
            .single();
        if (!shop) {
            res.status(400).json({ success: false, error: 'Branch not found' });
            return;
        }
        const { data, error } = await supabase
            .from(TABLE)
            .insert({ ...body, is_active: true })
            .select()
            .single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'create', resource: TABLE, resource_id: data.id, new_value: body });
        (0, shared_1.created)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Update ────────────────────────────────────────────────────────────────────
async function updateBarber(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: old } = await supabase.from(TABLE).select().eq('id', id).single();
        if (!old) {
            res.status(404).json({ success: false, error: 'Barber not found' });
            return;
        }
        const { data, error } = await supabase
            .from(TABLE)
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'update', resource: TABLE, resource_id: id, old_value: old, new_value: body });
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Toggle Active ─────────────────────────────────────────────────────────────
async function toggleBarberActive(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: current } = await supabase.from(TABLE).select('is_active').eq('id', id).single();
        if (!current) {
            res.status(404).json({ success: false, error: 'Barber not found' });
            return;
        }
        const newStatus = !current.is_active;
        const { data, error } = await supabase
            .from(TABLE)
            .update({ is_active: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, {
            action: 'status_change',
            resource: TABLE,
            resource_id: id,
            old_value: { is_active: current.is_active },
            new_value: { is_active: newStatus },
        });
        (0, shared_1.ok)(res, data, `Barber ${newStatus ? 'activated' : 'deactivated'}`);
    }
    catch (err) {
        next(err);
    }
}
// ── Get Barber Stats ──────────────────────────────────────────────────────────
async function getBarberStats(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [totalResult, monthResult, ratingResult] = await Promise.all([
            supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('barber_id', id)
                .eq('status', 'completed'),
            supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('barber_id', id)
                .gte('appointment_date', firstOfMonth)
                .in('status', ['completed', 'confirmed', 'pending']),
            supabase
                .from('reviews')
                .select('rating')
                .eq('barber_id', id),
        ]);
        const ratings = ratingResult.data ?? [];
        const avgRating = ratings.length
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;
        (0, shared_1.ok)(res, {
            total_completed_appointments: totalResult.count ?? 0,
            appointments_this_month: monthResult.count ?? 0,
            avg_rating: Math.round(avgRating * 10) / 10,
            review_count: ratings.length,
        });
    }
    catch (err) {
        next(err);
    }
}
// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteBarber(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { count: activeAppts } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('barber_id', id)
            .in('status', ['pending', 'confirmed']);
        if (activeAppts && activeAppts > 0) {
            res.status(409).json({
                success: false,
                error: `Cannot delete: ${activeAppts} active appointment(s) assigned to this barber`,
            });
            return;
        }
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'delete', resource: TABLE, resource_id: id });
        (0, shared_1.noContent)(res);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=barber.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBarbershops = listBarbershops;
exports.getBarbershop = getBarbershop;
exports.createBarbershop = createBarbershop;
exports.updateBarbershop = updateBarbershop;
exports.toggleBarbershopActive = toggleBarbershopActive;
exports.deleteBarbershop = deleteBarbershop;
const shared_1 = require("@barbershop/shared");
const TABLE = 'branches';
// ── List ──────────────────────────────────────────────────────────────────────
async function listBarbershops(req, res, next) {
    try {
        const query = req.query;
        const { page, limit, offset } = (0, shared_1.parsePagination)(req.query);
        const supabase = (0, shared_1.getSupabaseAdmin)();
        let dbQuery = supabase
            .from(TABLE)
            .select('*', { count: 'exact' })
            .order(query.sort_by ?? 'created_at', { ascending: query.sort_order === 'asc' })
            .range(offset, offset + limit - 1);
        if (query.search) {
            dbQuery = dbQuery.or(`name.ilike.%${query.search}%,address.ilike.%${query.search}%`);
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
async function getBarbershop(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from(TABLE)
            .select(`
        *,
        barbers (id, name, is_active, photo_url),
        service_categories (id, name, price, duration_minutes, is_active)
      `)
            .eq('id', id)
            .single();
        if (error || !data) {
            res.status(404).json({ success: false, error: 'Barbershop not found' });
            return;
        }
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Create ────────────────────────────────────────────────────────────────────
async function createBarbershop(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        // Default coordinates for Barranquilla if not provided
        const payload = {
            ...body,
            latitude: body.latitude ?? 10.9878,
            longitude: body.longitude ?? -74.7889,
            phone: body.phone ?? '+57 000 000 0000',
        };
        const { data, error } = await supabase
            .from(TABLE)
            .insert(payload)
            .select()
            .single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, {
            action: 'create',
            resource: TABLE,
            resource_id: data.id,
            new_value: body,
        });
        (0, shared_1.created)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Update ────────────────────────────────────────────────────────────────────
async function updateBarbershop(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        // Fetch old value for audit
        const { data: old } = await supabase.from(TABLE).select().eq('id', id).single();
        if (!old) {
            res.status(404).json({ success: false, error: 'Barbershop not found' });
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
        await (0, shared_1.auditLog)(req, {
            action: 'update',
            resource: TABLE,
            resource_id: id,
            old_value: old,
            new_value: body,
        });
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Toggle Active ─────────────────────────────────────────────────────────────
async function toggleBarbershopActive(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: current } = await supabase.from(TABLE).select('is_active').eq('id', id).single();
        if (!current) {
            res.status(404).json({ success: false, error: 'Barbershop not found' });
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
        (0, shared_1.ok)(res, data, `Barbershop ${newStatus ? 'activated' : 'deactivated'}`);
    }
    catch (err) {
        next(err);
    }
}
// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteBarbershop(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        // Soft check: prevent deleting if there are active/pending appointments
        const { count: activeAppts } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', id)
            .in('status', ['pending', 'confirmed']);
        if (activeAppts && activeAppts > 0) {
            res.status(409).json({
                success: false,
                error: `Cannot delete: ${activeAppts} active appointment(s) exist`,
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
//# sourceMappingURL=barbershop.controller.js.map
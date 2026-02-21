"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = listServices;
exports.getService = getService;
exports.createService = createService;
exports.updateService = updateService;
exports.toggleServiceActive = toggleServiceActive;
exports.deleteService = deleteService;
const shared_1 = require("@barbershop/shared");
const TABLE = 'service_categories';
async function listServices(req, res, next) {
    try {
        const query = req.query;
        const { page, limit, offset } = (0, shared_1.parsePagination)(req.query);
        const supabase = (0, shared_1.getSupabaseAdmin)();
        let dbQuery = supabase
            .from(TABLE)
            .select('*', { count: 'exact' })
            .order(query.sort_by ?? 'created_at', { ascending: query.sort_order === 'asc' })
            .range(offset, offset + limit - 1);
        if (query.search)
            dbQuery = dbQuery.ilike('name', `%${query.search}%`);
        if (query.is_active !== undefined)
            dbQuery = dbQuery.eq('is_active', query.is_active === 'true');
        if (query.min_price !== undefined)
            dbQuery = dbQuery.gte('price', query.min_price);
        if (query.max_price !== undefined)
            dbQuery = dbQuery.lte('price', query.max_price);
        const { data, error, count } = await dbQuery;
        if (error)
            throw error;
        (0, shared_1.paginated)(res, data ?? [], count ?? 0, { page, limit });
    }
    catch (err) {
        next(err);
    }
}
async function getService(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function createService(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase.from(TABLE).insert(body).select().single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'create', resource: TABLE, resource_id: data.id, new_value: body });
        (0, shared_1.created)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function updateService(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: old } = await supabase.from(TABLE).select().eq('id', id).single();
        if (!old) {
            res.status(404).json({ success: false, error: 'Service not found' });
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
async function toggleServiceActive(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data: current } = await supabase.from(TABLE).select('is_active').eq('id', id).single();
        if (!current) {
            res.status(404).json({ success: false, error: 'Service not found' });
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
            action: 'status_change', resource: TABLE, resource_id: id,
            old_value: { is_active: current.is_active }, new_value: { is_active: newStatus },
        });
        (0, shared_1.ok)(res, data, `Service ${newStatus ? 'activated' : 'deactivated'}`);
    }
    catch (err) {
        next(err);
    }
}
async function deleteService(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { count: usageCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', id)
            .in('status', ['pending', 'confirmed']);
        if (usageCount && usageCount > 0) {
            res.status(409).json({ success: false, error: `Service has ${usageCount} active appointment(s)` });
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
//# sourceMappingURL=service.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
exports.noContent = noContent;
exports.paginated = paginated;
exports.parsePagination = parsePagination;
exports.auditLog = auditLog;
exports.applyPagination = applyPagination;
const client_1 = require("../supabase/client");
// ── Response Helpers ──────────────────────────────────────────────────────────
function ok(res, data, message, status = 200) {
    const response = { success: true, data, message };
    res.status(status).json(response);
}
function created(res, data) {
    ok(res, data, 'Created successfully', 201);
}
function noContent(res) {
    res.status(204).send();
}
function paginated(res, data, total, query) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = {
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
function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
/**
 * Records admin operations to the audit_logs table (RF24).
 * Non-blocking — failures are logged but don't interrupt the request.
 */
async function auditLog(req, entry) {
    if (!req.user)
        return;
    const supabase = (0, client_1.getSupabaseAdmin)();
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
function applyPagination(query, offset, limit) {
    return query.range(offset, offset + limit - 1);
}
//# sourceMappingURL=index.js.map
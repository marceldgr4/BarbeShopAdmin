"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.scopeToBarbershop = scopeToBarbershop;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../supabase/client");
function mapRoleFromAdminTable(roleName) {
    const normalized = roleName?.toLowerCase();
    if (normalized === 'admin' || normalized === 'super_admin' || normalized === 'superadmin') {
        return 'admin';
    }
    if (normalized === 'barber') {
        return 'barber';
    }
    return 'client';
}
// ── Token Verification ────────────────────────────────────────────────────────
/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Attaches the decoded user to req.user.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        // ── Development Bypass ──────────────────────────────────────────────────
        if (process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true') {
            req.user = {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'dev@example.com',
                role: 'admin',
            };
            return next();
        }
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Missing authorization token' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ success: false, error: 'Server misconfiguration' });
            return;
        }
        // Verify JWT signature with Supabase JWT secret
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const userId = decoded.sub;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Invalid token payload' });
            return;
        }
        // Fetch the user's metadata from Supabase to get role
        const supabase = (0, client_1.getSupabaseAdmin)();
        // Schema A: profiles(id, email, role, branch_id)
        const profileResult = await supabase
            .from('profiles')
            .select('id, email, role, branch_id')
            .eq('id', userId)
            .maybeSingle();
        if (!profileResult.error && profileResult.data) {
            req.user = {
                id: profileResult.data.id,
                email: profileResult.data.email,
                role: profileResult.data.role,
                branch_id: profileResult.data.branch_id,
            };
            next();
            return;
        }
        // Schema B: admin_users(user_id, role_id, branch_id) + roles(role_name)
        const adminResult = await supabase
            .from('admin_users')
            .select('user_id, branch_id, roles:role_id(role_name)')
            .eq('user_id', userId)
            .maybeSingle();
        if (!adminResult.error && adminResult.data) {
            const mappedRole = mapRoleFromAdminTable(adminResult.data.roles?.role_name);
            req.user = {
                id: adminResult.data.user_id,
                email: decoded.email || '',
                role: mappedRole,
                branch_id: adminResult.data.branch_id || undefined,
            };
            next();
            return;
        }
        // If user exists in auth but not in role tables, authenticate as client.
        req.user = {
            id: userId,
            email: decoded.email || '',
            role: 'client',
        };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Token expired' });
            return;
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ success: false, error: 'Invalid token' });
            return;
        }
        next(err);
    }
}
// ── Role Authorization ────────────────────────────────────────────────────────
/**
 * Middleware factory — only allows users with the specified role(s) through.
 * Must be used AFTER `authenticate`.
 *
 * @example
 * router.get('/stats', authenticate, requireRole('admin'), dashboardController.getStats)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${roles.join(' or ')}`,
            });
            return;
        }
        next();
    };
}
/**
 * Ensures the admin can only access resources belonging to their barbershop.
 * Super-admins (no branch_id) can access everything.
 */
function scopeToBarbershop(req, res, next) {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
    }
    // If the admin is scoped to a barbershop, inject it into the query
    if (req.user.branch_id) {
        req.query.branch_id = req.user.branch_id;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map
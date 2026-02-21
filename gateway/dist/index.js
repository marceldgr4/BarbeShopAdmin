"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from root
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const express_1 = __importDefault(require("express"));
const express_http_proxy_1 = __importDefault(require("express-http-proxy"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const shared_1 = require("@barbershop/shared");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3000;
// ── Service URLs ──────────────────────────────────────────────────────────────
const SERVICES = {
    barbershops: process.env.BARBERSHOPS_URL ?? 'http://localhost:3001',
    barbers: process.env.BARBERS_URL ?? 'http://localhost:3002',
    services: process.env.SERVICES_URL ?? 'http://localhost:3003',
    schedules: process.env.SCHEDULES_URL ?? 'http://localhost:3004',
    dashboard: process.env.DASHBOARD_URL ?? 'http://localhost:3005',
    appointments: process.env.APPOINTMENTS_URL ?? 'http://localhost:3006',
};
// ── Security ──────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
const isDev = process.env.NODE_ENV === 'development';
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',');
app.use((0, cors_1.default)({
    origin: isDev ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-bypass'],
}));
// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many auth attempts.' },
});
app.use(globalLimiter);
// ── Logging ───────────────────────────────────────────────────────────────────
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: Object.keys(SERVICES),
        },
    });
});
// ── Proxy Helper ──────────────────────────────────────────────────────────────
function proxyTo(target, pathRewrite) {
    return (0, express_http_proxy_1.default)(target, {
        proxyReqPathResolver: (req) => {
            const path = pathRewrite
                ? req.url.replace(new RegExp(`^${pathRewrite}`), '')
                : req.url;
            return path || '/';
        },
        // Forward the original Authorization header
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq.headers.authorization) {
                proxyReqOpts.headers = proxyReqOpts.headers || {};
                proxyReqOpts.headers['authorization'] = srcReq.headers.authorization;
                // Pass resolved user info downstream as internal headers
                if (srcReq.user) {
                    const user = srcReq.user;
                    proxyReqOpts.headers['x-user-id'] = user.id;
                    proxyReqOpts.headers['x-user-role'] = user.role;
                    proxyReqOpts.headers['x-user-barbershop-id'] = user.branch_id ?? '';
                }
            }
            return proxyReqOpts;
        },
    });
}
// ── Admin Routes — all require authentication + admin role ────────────────────
const adminAuth = [shared_1.authenticate, (0, shared_1.requireRole)('admin')];
// Barbershops
app.use('/api/admin/barbershops', ...adminAuth, proxyTo(SERVICES.barbershops, '/api/admin/barbershops'));
// Barbers
app.use('/api/admin/barbers', ...adminAuth, proxyTo(SERVICES.barbers, '/api/admin/barbers'));
// Services (haircut services)
app.use('/api/admin/services', ...adminAuth, proxyTo(SERVICES.services, '/api/admin/services'));
// Schedules
app.use('/api/admin/schedules', ...adminAuth, proxyTo(SERVICES.schedules, '/api/admin/schedules'));
// Dashboard & metrics
app.use('/api/admin/dashboard', ...adminAuth, proxyTo(SERVICES.dashboard, '/api/admin/dashboard'));
// Appointments management
app.use('/api/admin/appointments', ...adminAuth, proxyTo(SERVICES.appointments, '/api/admin/appointments'));
// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(shared_1.errorHandler);
// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV}`);
    console.log(`   Services: ${JSON.stringify(SERVICES, null, 2)}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map
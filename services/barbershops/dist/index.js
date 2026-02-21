"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
const express_1 = __importDefault(require("express"));
const shared_1 = require("@barbershop/shared");
const barbershop_routes_1 = __importDefault(require("./routes/barbershop.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use(express_1.default.json());
app.use(shared_1.requestLogger);
// Internal health check
app.get('/health', (_req, res) => {
    res.json({ success: true, data: { service: 'barbershops', status: 'ok' } });
});
// Routes — note: gateway already stripped /api/admin/barbershops prefix
app.use('/', barbershop_routes_1.default);
app.use(shared_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🏪 Barbershops service on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map
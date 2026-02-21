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
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3005;
app.use(express_1.default.json());
app.use(shared_1.requestLogger);
app.get('/health', (_req, res) => res.json({ success: true, data: { service: 'dashboard', status: 'ok' } }));
app.use('/', dashboard_routes_1.default);
app.use(shared_1.errorHandler);
app.listen(PORT, () => console.log(`📊 Dashboard service on port ${PORT}`));
exports.default = app;
//# sourceMappingURL=index.js.map
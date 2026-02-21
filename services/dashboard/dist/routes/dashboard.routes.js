"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// GET /                 → main KPI stats (totals, rates, top lists)
// GET /appointments/by-day → time-series for the chart
// GET /barbers/occupancy   → occupancy per barber in a period
// GET /revenue             → estimated revenue by month
router.get('/', dashboard_controller_1.getDashboardStats);
router.get('/appointments/by-day', dashboard_controller_1.getAppointmentsByDay);
router.get('/barbers/occupancy', dashboard_controller_1.getOccupancyByBarber);
router.get('/revenue', dashboard_controller_1.getRevenueEstimate);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map
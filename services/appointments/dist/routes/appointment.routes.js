"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointment_controller_1 = require("../controllers/appointment.controller");
const router = (0, express_1.Router)();
router.get('/', appointment_controller_1.listAppointments);
router.get('/today', appointment_controller_1.getTodayAgenda);
router.get('/:id', appointment_controller_1.getAppointment);
router.patch('/:id/status', appointment_controller_1.updateAppointmentStatus);
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map
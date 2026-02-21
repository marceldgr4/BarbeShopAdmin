"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@barbershop/shared");
const schedule_controller_1 = require("../controllers/schedule.controller");
const schedule_validator_1 = require("../validators/schedule.validator");
const router = (0, express_1.Router)();
// ── Weekly Schedules ──────────────────────────────────────────────────────────
router.get('/', (0, shared_1.validateQuery)(schedule_validator_1.listSchedulesSchema), schedule_controller_1.getBarberSchedules);
router.post('/', (0, shared_1.validateBody)(schedule_validator_1.createScheduleSchema), schedule_controller_1.createSchedule);
router.patch('/:id', (0, shared_1.validateBody)(schedule_validator_1.updateScheduleSchema), schedule_controller_1.updateSchedule);
// Bulk upsert — set the entire week in one call
router.post('/bulk', (0, shared_1.validateBody)(schedule_validator_1.bulkUpsertScheduleSchema), schedule_controller_1.bulkUpsertSchedule);
// ── Availability Slots ────────────────────────────────────────────────────────
router.get('/availability', (0, shared_1.validateQuery)(schedule_validator_1.availabilityQuerySchema), schedule_controller_1.getAvailableSlots);
// ── Breaks ────────────────────────────────────────────────────────────────────
router.get('/breaks/:barber_id', schedule_controller_1.getBarberBreaks);
router.post('/breaks', (0, shared_1.validateBody)(schedule_validator_1.createBreakSchema), schedule_controller_1.createBreak);
router.delete('/breaks/:id', schedule_controller_1.deleteBreak);
// ── Days Off ──────────────────────────────────────────────────────────────────
router.get('/days-off/:barber_id', schedule_controller_1.getBarberDaysOff);
router.post('/days-off', (0, shared_1.validateBody)(schedule_validator_1.createDayOffSchema), schedule_controller_1.createDayOff);
router.delete('/days-off/:id', schedule_controller_1.deleteDayOff);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map
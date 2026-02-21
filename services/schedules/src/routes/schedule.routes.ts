import { Router } from 'express';
import { validateBody, validateQuery } from '@barbershop/shared';
import {
  getBarberSchedules, createSchedule, updateSchedule, bulkUpsertSchedule,
  getBarberBreaks, createBreak, deleteBreak,
  getBarberDaysOff, createDayOff, deleteDayOff,
  getAvailableSlots,
} from '../controllers/schedule.controller';
import {
  createScheduleSchema, updateScheduleSchema, bulkUpsertScheduleSchema,
  createBreakSchema, createDayOffSchema, listSchedulesSchema, availabilityQuerySchema,
} from '../validators/schedule.validator';

const router = Router();

// ── Weekly Schedules ──────────────────────────────────────────────────────────
router.get('/', validateQuery(listSchedulesSchema), getBarberSchedules);
router.post('/', validateBody(createScheduleSchema), createSchedule);
router.patch('/:id', validateBody(updateScheduleSchema), updateSchedule);

// Bulk upsert — set the entire week in one call
router.post('/bulk', validateBody(bulkUpsertScheduleSchema), bulkUpsertSchedule);

// ── Availability Slots ────────────────────────────────────────────────────────
router.get('/availability', validateQuery(availabilityQuerySchema), getAvailableSlots);

// ── Breaks ────────────────────────────────────────────────────────────────────
router.get('/breaks/:barber_id', getBarberBreaks);
router.post('/breaks', validateBody(createBreakSchema), createBreak);
router.delete('/breaks/:id', deleteBreak);

// ── Days Off ──────────────────────────────────────────────────────────────────
router.get('/days-off/:barber_id', getBarberDaysOff);
router.post('/days-off', validateBody(createDayOffSchema), createDayOff);
router.delete('/days-off/:id', deleteDayOff);

export default router;

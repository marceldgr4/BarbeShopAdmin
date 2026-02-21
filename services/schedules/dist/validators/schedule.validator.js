"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityQuerySchema = exports.listSchedulesSchema = exports.createDayOffSchema = exports.createBreakSchema = exports.bulkUpsertScheduleSchema = exports.updateScheduleSchema = exports.createScheduleSchema = void 0;
const zod_1 = require("zod");
const timeRegex = /^\d{2}:\d{2}$/;
const weekdaySchema = zod_1.z.number().int().min(0).max(6);
// ── Barber Schedule ───────────────────────────────────────────────────────────
exports.createScheduleSchema = zod_1.z.object({
    barber_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    weekday: weekdaySchema,
    start_time: zod_1.z.string().regex(timeRegex, 'Format HH:MM'),
    end_time: zod_1.z.string().regex(timeRegex, 'Format HH:MM'),
    is_working: zod_1.z.boolean().default(true),
}).refine((d) => d.start_time < d.end_time, {
    message: 'start_time must be before end_time',
    path: ['end_time'],
});
exports.updateScheduleSchema = zod_1.z.object({
    start_time: zod_1.z.string().regex(timeRegex).optional(),
    end_time: zod_1.z.string().regex(timeRegex).optional(),
    is_working: zod_1.z.boolean().optional(),
}).refine((d) => {
    if (d.start_time && d.end_time)
        return d.start_time < d.end_time;
    return true;
}, { message: 'start_time must be before end_time', path: ['end_time'] });
// Bulk upsert — full week at once
exports.bulkUpsertScheduleSchema = zod_1.z.object({
    barber_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    schedules: zod_1.z.array(zod_1.z.object({
        weekday: weekdaySchema,
        start_time: zod_1.z.string().regex(timeRegex),
        end_time: zod_1.z.string().regex(timeRegex),
        is_working: zod_1.z.boolean(),
    })).length(7, 'Must provide all 7 days'),
});
// ── Break Times ───────────────────────────────────────────────────────────────
exports.createBreakSchema = zod_1.z.object({
    barber_id: zod_1.z.string().uuid(),
    weekday: weekdaySchema,
    start_time: zod_1.z.string().regex(timeRegex),
    end_time: zod_1.z.string().regex(timeRegex),
    label: zod_1.z.string().max(50).optional(),
}).refine((d) => d.start_time < d.end_time, {
    message: 'start_time must be before end_time', path: ['end_time'],
});
// ── Days Off ──────────────────────────────────────────────────────────────────
exports.createDayOffSchema = zod_1.z.object({
    barber_id: zod_1.z.string().uuid(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
    reason: zod_1.z.string().max(200).optional(),
});
exports.listSchedulesSchema = zod_1.z.object({
    barber_id: zod_1.z.string().uuid().optional(),
    branch_id: zod_1.z.string().uuid().optional(),
});
exports.availabilityQuerySchema = zod_1.z.object({
    barber_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
    service_duration: zod_1.z.coerce.number().int().min(5).optional().default(30),
});
//# sourceMappingURL=schedule.validator.js.map
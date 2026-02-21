import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;
const weekdaySchema = z.number().int().min(0).max(6);

// ── Barber Schedule ───────────────────────────────────────────────────────────

export const createScheduleSchema = z.object({
  barber_id:     z.string().uuid(),
  branch_id: z.string().uuid(),
  weekday:       weekdaySchema,
  start_time:    z.string().regex(timeRegex, 'Format HH:MM'),
  end_time:      z.string().regex(timeRegex, 'Format HH:MM'),
  is_working:    z.boolean().default(true),
}).refine((d) => d.start_time < d.end_time, {
  message: 'start_time must be before end_time',
  path: ['end_time'],
});

export const updateScheduleSchema = z.object({
  start_time: z.string().regex(timeRegex).optional(),
  end_time:   z.string().regex(timeRegex).optional(),
  is_working: z.boolean().optional(),
}).refine((d) => {
  if (d.start_time && d.end_time) return d.start_time < d.end_time;
  return true;
}, { message: 'start_time must be before end_time', path: ['end_time'] });

// Bulk upsert — full week at once
export const bulkUpsertScheduleSchema = z.object({
  barber_id:     z.string().uuid(),
  branch_id: z.string().uuid(),
  schedules: z.array(z.object({
    weekday:    weekdaySchema,
    start_time: z.string().regex(timeRegex),
    end_time:   z.string().regex(timeRegex),
    is_working: z.boolean(),
  })).length(7, 'Must provide all 7 days'),
});

// ── Break Times ───────────────────────────────────────────────────────────────

export const createBreakSchema = z.object({
  barber_id:  z.string().uuid(),
  weekday:    weekdaySchema,
  start_time: z.string().regex(timeRegex),
  end_time:   z.string().regex(timeRegex),
  label:      z.string().max(50).optional(),
}).refine((d) => d.start_time < d.end_time, {
  message: 'start_time must be before end_time', path: ['end_time'],
});

// ── Days Off ──────────────────────────────────────────────────────────────────

export const createDayOffSchema = z.object({
  barber_id: z.string().uuid(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  reason:    z.string().max(200).optional(),
});

export const listSchedulesSchema = z.object({
  barber_id:     z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
});

export const availabilityQuerySchema = z.object({
  barber_id:     z.string().uuid(),
  branch_id: z.string().uuid(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  service_duration: z.coerce.number().int().min(5).optional().default(30),
});

export type CreateScheduleInput       = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput       = z.infer<typeof updateScheduleSchema>;
export type BulkUpsertScheduleInput   = z.infer<typeof bulkUpsertScheduleSchema>;
export type CreateBreakInput          = z.infer<typeof createBreakSchema>;
export type CreateDayOffInput         = z.infer<typeof createDayOffSchema>;
export type AvailabilityQuery         = z.infer<typeof availabilityQuerySchema>;

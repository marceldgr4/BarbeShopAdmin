"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBarberSchedules = getBarberSchedules;
exports.createSchedule = createSchedule;
exports.updateSchedule = updateSchedule;
exports.bulkUpsertSchedule = bulkUpsertSchedule;
exports.getBarberBreaks = getBarberBreaks;
exports.createBreak = createBreak;
exports.deleteBreak = deleteBreak;
exports.getBarberDaysOff = getBarberDaysOff;
exports.createDayOff = createDayOff;
exports.deleteDayOff = deleteDayOff;
exports.getAvailableSlots = getAvailableSlots;
const shared_1 = require("@barbershop/shared");
// ── Schedule CRUD ─────────────────────────────────────────────────────────────
async function getBarberSchedules(req, res, next) {
    try {
        const { barber_id, branch_id } = req.query;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        let query = supabase.from('barber_schedules').select('*').order('weekday');
        if (barber_id)
            query = query.eq('barber_id', barber_id);
        if (branch_id)
            query = query.eq('branch_id', branch_id);
        const { data, error } = await query;
        if (error)
            throw error;
        (0, shared_1.ok)(res, data ?? []);
    }
    catch (err) {
        next(err);
    }
}
async function createSchedule(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        // Check if schedule for this weekday already exists
        const { data: existing } = await supabase
            .from('barber_schedules')
            .select('id')
            .eq('barber_id', body.barber_id)
            .eq('weekday', body.weekday)
            .single();
        if (existing) {
            res.status(409).json({ success: false, error: 'Schedule for this weekday already exists. Use PATCH to update.' });
            return;
        }
        const { data, error } = await supabase.from('barber_schedules').insert(body).select().single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'create', resource: 'barber_schedules', resource_id: data.id, new_value: body });
        (0, shared_1.created)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function updateSchedule(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from('barber_schedules')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error || !data) {
            res.status(404).json({ success: false, error: 'Schedule not found' });
            return;
        }
        await (0, shared_1.auditLog)(req, { action: 'update', resource: 'barber_schedules', resource_id: id, new_value: body });
        (0, shared_1.ok)(res, data);
    }
    catch (err) {
        next(err);
    }
}
// ── Bulk Upsert — set the full week at once ───────────────────────────────────
async function bulkUpsertSchedule(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const rows = body.schedules.map((s) => ({
            barber_id: body.barber_id,
            branch_id: body.branch_id,
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
            is_working: s.is_working,
            updated_at: new Date().toISOString(),
        }));
        const { data, error } = await supabase
            .from('barber_schedules')
            .upsert(rows, { onConflict: 'barber_id,weekday' })
            .select();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, {
            action: 'update',
            resource: 'barber_schedules',
            resource_id: body.barber_id,
            new_value: { barber_id: body.barber_id, schedule: body.schedules },
        });
        (0, shared_1.ok)(res, data, 'Full week schedule saved');
    }
    catch (err) {
        next(err);
    }
}
// ── Breaks ────────────────────────────────────────────────────────────────────
async function getBarberBreaks(req, res, next) {
    try {
        const { barber_id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from('barber_break_times')
            .select('*')
            .eq('barber_id', barber_id)
            .order('weekday')
            .order('start_time');
        if (error)
            throw error;
        (0, shared_1.ok)(res, data ?? []);
    }
    catch (err) {
        next(err);
    }
}
async function createBreak(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase.from('barber_break_times').insert(body).select().single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'create', resource: 'barber_break_times', resource_id: data.id, new_value: body });
        (0, shared_1.created)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function deleteBreak(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { error } = await supabase.from('barber_break_times').delete().eq('id', id);
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'delete', resource: 'barber_break_times', resource_id: id });
        (0, shared_1.noContent)(res);
    }
    catch (err) {
        next(err);
    }
}
// ── Days Off ──────────────────────────────────────────────────────────────────
async function getBarberDaysOff(req, res, next) {
    try {
        const { barber_id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase
            .from('barber_days_off')
            .select('*')
            .eq('barber_id', barber_id)
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date');
        if (error)
            throw error;
        (0, shared_1.ok)(res, data ?? []);
    }
    catch (err) {
        next(err);
    }
}
async function createDayOff(req, res, next) {
    try {
        const body = req.body;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { data, error } = await supabase.from('barber_days_off').insert(body).select().single();
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'create', resource: 'barber_days_off', resource_id: data.id, new_value: body });
        (0, shared_1.created)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function deleteDayOff(req, res, next) {
    try {
        const { id } = req.params;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const { error } = await supabase.from('barber_days_off').delete().eq('id', id);
        if (error)
            throw error;
        await (0, shared_1.auditLog)(req, { action: 'delete', resource: 'barber_days_off', resource_id: id });
        (0, shared_1.noContent)(res);
    }
    catch (err) {
        next(err);
    }
}
// ── Availability Slots ────────────────────────────────────────────────────────
/**
 * Computes available time slots for a barber on a given date.
 * Logic: take working hours, subtract breaks, subtract booked appointments.
 */
async function getAvailableSlots(req, res, next) {
    try {
        const { barber_id, branch_id, date, service_duration } = req.query;
        const supabase = (0, shared_1.getSupabaseAdmin)();
        const targetDate = new Date(date + 'T00:00:00');
        const weekday = targetDate.getDay(); // 0=Sun, 6=Sat
        // 1. Get working schedule for this day
        const { data: schedule } = await supabase
            .from('barber_schedules')
            .select('*')
            .eq('barber_id', barber_id)
            .eq('weekday', weekday)
            .single();
        if (!schedule || !schedule.is_working) {
            (0, shared_1.ok)(res, { available_slots: [], reason: 'Barber not working on this day' });
            return;
        }
        // 2. Check if it's a day off
        const { data: dayOff } = await supabase
            .from('barber_days_off')
            .select('id')
            .eq('barber_id', barber_id)
            .eq('date', date)
            .single();
        if (dayOff) {
            (0, shared_1.ok)(res, { available_slots: [], reason: 'Barber has a day off' });
            return;
        }
        // 3. Get break times
        const { data: breaks } = await supabase
            .from('barber_break_times')
            .select('start_time, end_time')
            .eq('barber_id', barber_id)
            .eq('weekday', weekday);
        // 4. Get existing appointments for the day
        const dayStart = date + 'T00:00:00';
        const dayEnd = date + 'T23:59:59';
        const { data: appointments } = await supabase
            .from('appointments')
            .select('scheduled_at, duration_minutes')
            .eq('barber_id', barber_id)
            .gte('scheduled_at', dayStart)
            .lte('scheduled_at', dayEnd)
            .not('status', 'in', '("cancelled","no_show")');
        // 5. Build slots (every 30min within working hours)
        const slots = generateSlots(date, schedule.start_time, schedule.end_time, service_duration ?? 30, breaks ?? [], appointments ?? []);
        (0, shared_1.ok)(res, { date, barber_id, available_slots: slots });
    }
    catch (err) {
        next(err);
    }
}
// ── Slot Generation Helper ────────────────────────────────────────────────────
function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}
function generateSlots(date, startTime, endTime, duration, breaks, appointments) {
    const workStart = timeToMinutes(startTime);
    const workEnd = timeToMinutes(endTime);
    const slots = [];
    // Convert breaks to minute ranges
    const breakRanges = breaks.map((b) => ({
        start: timeToMinutes(b.start_time),
        end: timeToMinutes(b.end_time),
    }));
    // Convert appointments to busy minute ranges
    const busyRanges = appointments.map((a) => {
        const apptTime = new Date(a.scheduled_at);
        const startMin = apptTime.getHours() * 60 + apptTime.getMinutes();
        return { start: startMin, end: startMin + a.duration_minutes };
    });
    // Generate every possible slot
    for (let slotStart = workStart; slotStart + duration <= workEnd; slotStart += 30) {
        const slotEnd = slotStart + duration;
        // Check if slot overlaps with any break
        const inBreak = breakRanges.some((b) => slotStart < b.end && slotEnd > b.start);
        if (inBreak)
            continue;
        // Check if slot overlaps with any appointment
        const isBusy = busyRanges.some((b) => slotStart < b.end && slotEnd > b.start);
        if (isBusy)
            continue;
        slots.push(`${date}T${minutesToTime(slotStart)}:00`);
    }
    return slots;
}
//# sourceMappingURL=schedule.controller.js.map
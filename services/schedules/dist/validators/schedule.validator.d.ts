import { z } from 'zod';
export declare const createScheduleSchema: z.ZodEffects<z.ZodObject<{
    barber_id: z.ZodString;
    branch_id: z.ZodString;
    weekday: z.ZodNumber;
    start_time: z.ZodString;
    end_time: z.ZodString;
    is_working: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    barber_id: string;
    branch_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    is_working: boolean;
}, {
    barber_id: string;
    branch_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    is_working?: boolean | undefined;
}>, {
    barber_id: string;
    branch_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    is_working: boolean;
}, {
    barber_id: string;
    branch_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    is_working?: boolean | undefined;
}>;
export declare const updateScheduleSchema: z.ZodEffects<z.ZodObject<{
    start_time: z.ZodOptional<z.ZodString>;
    end_time: z.ZodOptional<z.ZodString>;
    is_working: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    start_time?: string | undefined;
    end_time?: string | undefined;
    is_working?: boolean | undefined;
}, {
    start_time?: string | undefined;
    end_time?: string | undefined;
    is_working?: boolean | undefined;
}>, {
    start_time?: string | undefined;
    end_time?: string | undefined;
    is_working?: boolean | undefined;
}, {
    start_time?: string | undefined;
    end_time?: string | undefined;
    is_working?: boolean | undefined;
}>;
export declare const bulkUpsertScheduleSchema: z.ZodObject<{
    barber_id: z.ZodString;
    branch_id: z.ZodString;
    schedules: z.ZodArray<z.ZodObject<{
        weekday: z.ZodNumber;
        start_time: z.ZodString;
        end_time: z.ZodString;
        is_working: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        weekday: number;
        start_time: string;
        end_time: string;
        is_working: boolean;
    }, {
        weekday: number;
        start_time: string;
        end_time: string;
        is_working: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    barber_id: string;
    branch_id: string;
    schedules: {
        weekday: number;
        start_time: string;
        end_time: string;
        is_working: boolean;
    }[];
}, {
    barber_id: string;
    branch_id: string;
    schedules: {
        weekday: number;
        start_time: string;
        end_time: string;
        is_working: boolean;
    }[];
}>;
export declare const createBreakSchema: z.ZodEffects<z.ZodObject<{
    barber_id: z.ZodString;
    weekday: z.ZodNumber;
    start_time: z.ZodString;
    end_time: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    barber_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    label?: string | undefined;
}, {
    barber_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    label?: string | undefined;
}>, {
    barber_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    label?: string | undefined;
}, {
    barber_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    label?: string | undefined;
}>;
export declare const createDayOffSchema: z.ZodObject<{
    barber_id: z.ZodString;
    date: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    barber_id: string;
    date: string;
    reason?: string | undefined;
}, {
    barber_id: string;
    date: string;
    reason?: string | undefined;
}>;
export declare const listSchedulesSchema: z.ZodObject<{
    barber_id: z.ZodOptional<z.ZodString>;
    branch_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    barber_id?: string | undefined;
    branch_id?: string | undefined;
}, {
    barber_id?: string | undefined;
    branch_id?: string | undefined;
}>;
export declare const availabilityQuerySchema: z.ZodObject<{
    barber_id: z.ZodString;
    branch_id: z.ZodString;
    date: z.ZodString;
    service_duration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    barber_id: string;
    branch_id: string;
    date: string;
    service_duration: number;
}, {
    barber_id: string;
    branch_id: string;
    date: string;
    service_duration?: number | undefined;
}>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type BulkUpsertScheduleInput = z.infer<typeof bulkUpsertScheduleSchema>;
export type CreateBreakInput = z.infer<typeof createBreakSchema>;
export type CreateDayOffInput = z.infer<typeof createDayOffSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
//# sourceMappingURL=schedule.validator.d.ts.map
import { Request, Response, NextFunction } from 'express';
export declare function getBarberSchedules(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function bulkUpsertSchedule(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getBarberBreaks(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createBreak(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteBreak(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getBarberDaysOff(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createDayOff(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteDayOff(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Computes available time slots for a barber on a given date.
 * Logic: take working hours, subtract breaks, subtract booked appointments.
 */
export declare function getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=schedule.controller.d.ts.map
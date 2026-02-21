"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBarbersSchema = exports.updateBarberSchema = exports.createBarberSchema = void 0;
const zod_1 = require("zod");
exports.createBarberSchema = zod_1.z.object({
    branch_id: zod_1.z.string().uuid('Invalid branch UUID'),
    name: zod_1.z.string().min(2).max(100),
    bio: zod_1.z.string().max(500).optional(),
    specialty_id: zod_1.z.string().uuid().optional(),
    photo_url: zod_1.z.string().url().optional(),
});
exports.updateBarberSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    specialty_id: zod_1.z.string().uuid().optional(),
    photo_url: zod_1.z.string().url().optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.listBarbersSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().positive().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    branch_id: zod_1.z.string().uuid().optional(),
    is_active: zod_1.z.enum(['true', 'false']).optional(),
    sort_by: zod_1.z.enum(['name', 'created_at']).default('created_at'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=barber.validator.js.map
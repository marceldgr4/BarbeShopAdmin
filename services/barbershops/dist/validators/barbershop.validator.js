"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBarbershopsSchema = exports.updateBarbershopSchema = exports.createBarbershopSchema = void 0;
const zod_1 = require("zod");
exports.createBarbershopSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    address: zod_1.z.string().min(5).max(200),
    phone: zod_1.z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number').optional(),
    email: zod_1.z.string().email().optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    is_active: zod_1.z.boolean().default(true).optional(),
});
exports.updateBarbershopSchema = exports.createBarbershopSchema.partial();
exports.listBarbershopsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().positive().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    is_active: zod_1.z.enum(['true', 'false']).optional(),
    sort_by: zod_1.z.enum(['name', 'created_at']).default('created_at'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=barbershop.validator.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServicesSchema = exports.updateServiceSchema = exports.createServiceSchema = void 0;
const zod_1 = require("zod");
exports.createServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().max(500).optional(),
    duration_minutes: zod_1.z.number().int().min(5).max(480),
    price: zod_1.z.number().min(0),
    is_active: zod_1.z.boolean().default(true),
});
exports.updateServiceSchema = exports.createServiceSchema.partial();
exports.listServicesSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().positive().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    is_active: zod_1.z.enum(['true', 'false']).optional(),
    min_price: zod_1.z.coerce.number().optional(),
    max_price: zod_1.z.coerce.number().optional(),
    sort_by: zod_1.z.enum(['name', 'price', 'duration_minutes', 'created_at']).default('created_at'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=service.validator.js.map
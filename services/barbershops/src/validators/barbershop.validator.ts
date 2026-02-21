import { z } from 'zod';

export const createBarbershopSchema = z.object({
  name:          z.string().min(2).max(100),
  address:       z.string().min(5).max(200),
  phone:         z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number').optional(),
  email:         z.string().email().optional(),
  latitude:      z.number().min(-90).max(90).optional(),
  longitude:     z.number().min(-180).max(180).optional(),
  is_active:     z.boolean().default(true).optional(),
});

export const updateBarbershopSchema = createBarbershopSchema.partial();

export const listBarbershopsSchema = z.object({
  page:       z.coerce.number().positive().default(1),
  limit:      z.coerce.number().min(1).max(100).default(20),
  search:     z.string().optional(),
  is_active:  z.enum(['true', 'false']).optional(),
  sort_by:    z.enum(['name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>;
export type UpdateBarbershopInput = z.infer<typeof updateBarbershopSchema>;
export type ListBarbershopsQuery  = z.infer<typeof listBarbershopsSchema>;

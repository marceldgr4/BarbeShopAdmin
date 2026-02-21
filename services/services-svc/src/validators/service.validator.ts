import { z } from 'zod';

export const createServiceSchema = z.object({
  barbershop_id:    z.string().uuid(),
  name:             z.string().min(2).max(100),
  description:      z.string().max(500).optional(),
  duration_minutes: z.number().int().min(5).max(480),
  price:            z.number().min(0),
  is_active:        z.boolean().default(true),
  image_url:        z.string().url().optional(),
});

export const updateServiceSchema = createServiceSchema.omit({ barbershop_id: true }).partial();

export const listServicesSchema = z.object({
  page:          z.coerce.number().positive().default(1),
  limit:         z.coerce.number().min(1).max(100).default(20),
  search:        z.string().optional(),
  barbershop_id: z.string().uuid().optional(),
  is_active:     z.enum(['true', 'false']).optional(),
  min_price:     z.coerce.number().optional(),
  max_price:     z.coerce.number().optional(),
  sort_by:       z.enum(['name', 'price', 'duration_minutes', 'created_at']).default('created_at'),
  sort_order:    z.enum(['asc', 'desc']).default('desc'),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery  = z.infer<typeof listServicesSchema>;

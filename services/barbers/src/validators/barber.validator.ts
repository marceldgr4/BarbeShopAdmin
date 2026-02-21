import { z } from 'zod';

export const createBarberSchema = z.object({
  branch_id:    z.string().uuid('Invalid branch UUID'),
  name:         z.string().min(2).max(100),
  bio:          z.string().max(500).optional(),
  specialty_id: z.string().uuid().optional(),
  photo_url:    z.string().url().optional(),
});

export const updateBarberSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  bio:         z.string().max(500).optional(),
  specialty_id:z.string().uuid().optional(),
  photo_url:   z.string().url().optional(),
  is_active:   z.boolean().optional(),
});

export const listBarbersSchema = z.object({
  page:          z.coerce.number().positive().default(1),
  limit:         z.coerce.number().min(1).max(100).default(20),
  search:        z.string().optional(),
  branch_id:     z.string().uuid().optional(),
  is_active:     z.enum(['true', 'false']).optional(),
  sort_by:       z.enum(['name', 'created_at']).default('created_at'),
  sort_order:    z.enum(['asc', 'desc']).default('desc'),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type ListBarbersQuery  = z.infer<typeof listBarbersSchema>;

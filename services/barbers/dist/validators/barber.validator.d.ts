import { z } from 'zod';
export declare const createBarberSchema: z.ZodObject<{
    branch_id: z.ZodString;
    name: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    specialty_id: z.ZodOptional<z.ZodString>;
    photo_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    branch_id: string;
    name: string;
    bio?: string | undefined;
    specialty_id?: string | undefined;
    photo_url?: string | undefined;
}, {
    branch_id: string;
    name: string;
    bio?: string | undefined;
    specialty_id?: string | undefined;
    photo_url?: string | undefined;
}>;
export declare const updateBarberSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    specialty_id: z.ZodOptional<z.ZodString>;
    photo_url: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bio?: string | undefined;
    specialty_id?: string | undefined;
    photo_url?: string | undefined;
    is_active?: boolean | undefined;
}, {
    name?: string | undefined;
    bio?: string | undefined;
    specialty_id?: string | undefined;
    photo_url?: string | undefined;
    is_active?: boolean | undefined;
}>;
export declare const listBarbersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    branch_id: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    sort_by: z.ZodDefault<z.ZodEnum<["name", "created_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort_by: "name" | "created_at";
    sort_order: "asc" | "desc";
    branch_id?: string | undefined;
    is_active?: "true" | "false" | undefined;
    search?: string | undefined;
}, {
    branch_id?: string | undefined;
    is_active?: "true" | "false" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    sort_by?: "name" | "created_at" | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type ListBarbersQuery = z.infer<typeof listBarbersSchema>;
//# sourceMappingURL=barber.validator.d.ts.map
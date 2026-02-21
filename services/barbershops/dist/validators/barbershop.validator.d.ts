import { z } from 'zod';
export declare const createBarbershopSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    address: string;
    phone?: string | undefined;
    email?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    is_active?: boolean | undefined;
}, {
    name: string;
    address: string;
    phone?: string | undefined;
    email?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    is_active?: boolean | undefined;
}>;
export declare const updateBarbershopSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    is_active: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    is_active?: boolean | undefined;
}, {
    name?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    is_active?: boolean | undefined;
}>;
export declare const listBarbershopsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    sort_by: z.ZodDefault<z.ZodEnum<["name", "created_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort_by: "name" | "created_at";
    sort_order: "asc" | "desc";
    is_active?: "true" | "false" | undefined;
    search?: string | undefined;
}, {
    is_active?: "true" | "false" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    sort_by?: "name" | "created_at" | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>;
export type UpdateBarbershopInput = z.infer<typeof updateBarbershopSchema>;
export type ListBarbershopsQuery = z.infer<typeof listBarbershopsSchema>;
//# sourceMappingURL=barbershop.validator.d.ts.map
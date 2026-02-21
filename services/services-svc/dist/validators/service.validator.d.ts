import { z } from 'zod';
export declare const createServiceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    duration_minutes: z.ZodNumber;
    price: z.ZodNumber;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
    description?: string | undefined;
}, {
    name: string;
    duration_minutes: number;
    price: number;
    description?: string | undefined;
    is_active?: boolean | undefined;
}>;
export declare const updateServiceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    duration_minutes: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    duration_minutes?: number | undefined;
    price?: number | undefined;
    is_active?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    duration_minutes?: number | undefined;
    price?: number | undefined;
    is_active?: boolean | undefined;
}>;
export declare const listServicesSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    min_price: z.ZodOptional<z.ZodNumber>;
    max_price: z.ZodOptional<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["name", "price", "duration_minutes", "created_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort_by: "name" | "duration_minutes" | "price" | "created_at";
    sort_order: "asc" | "desc";
    is_active?: "true" | "false" | undefined;
    search?: string | undefined;
    min_price?: number | undefined;
    max_price?: number | undefined;
}, {
    is_active?: "true" | "false" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    min_price?: number | undefined;
    max_price?: number | undefined;
    sort_by?: "name" | "duration_minutes" | "price" | "created_at" | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesSchema>;
//# sourceMappingURL=service.validator.d.ts.map
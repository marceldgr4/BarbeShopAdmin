export type UserRole = 'admin' | 'barber' | 'client';
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    branch_id?: string;
}
export interface Barbershop {
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    phone: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    opening_time: string;
    closing_time: string;
    is_active: boolean;
    cover_image_url?: string;
    created_at: string;
    updated_at: string;
}
export type CreateBarbershopDto = Omit<Barbershop, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBarbershopDto = Partial<CreateBarbershopDto>;
export interface Barber {
    id: string;
    user_id: string;
    branch_id: string;
    full_name: string;
    bio?: string;
    specialties: string[];
    avatar_url?: string;
    rating: number;
    review_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export type CreateBarberDto = {
    user_id: string;
    branch_id: string;
    full_name: string;
    bio?: string;
    specialties?: string[];
    avatar_url?: string;
};
export type UpdateBarberDto = Partial<Omit<CreateBarberDto, 'user_id' | 'branch_id'>>;
export interface Service {
    id: string;
    branch_id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
    image_url?: string;
    created_at: string;
    updated_at: string;
}
export type CreateServiceDto = Omit<Service, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServiceDto = Partial<CreateServiceDto>;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface BarberSchedule {
    id: string;
    barber_id: string;
    branch_id: string;
    weekday: Weekday;
    start_time: string;
    end_time: string;
    is_working: boolean;
    created_at: string;
    updated_at: string;
}
export interface BreakTime {
    id: string;
    barber_id: string;
    weekday: Weekday;
    start_time: string;
    end_time: string;
    label?: string;
}
export interface BarberDayOff {
    id: string;
    barber_id: string;
    date: string;
    reason?: string;
    created_at: string;
}
export type CreateScheduleDto = Omit<BarberSchedule, 'id' | 'created_at' | 'updated_at'>;
export type UpdateScheduleDto = Partial<Omit<CreateScheduleDto, 'barber_id' | 'weekday'>>;
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export interface Appointment {
    id: string;
    client_id: string;
    barber_id: string;
    branch_id: string;
    service_id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: AppointmentStatus;
    notes?: string;
    cancellation_reason?: string;
    cancelled_at?: string;
    created_at: string;
    updated_at: string;
}
export type UpdateAppointmentStatusDto = {
    status: AppointmentStatus;
    cancellation_reason?: string;
};
export interface DashboardStats {
    total_appointments: number;
    appointments_today: number;
    appointments_this_week: number;
    appointments_this_month: number;
    cancelled_this_month: number;
    no_show_this_month: number;
    completion_rate: number;
    active_barbers: number;
    active_services: number;
    top_services: TopServiceStat[];
    top_barbers: TopBarberStat[];
    appointments_by_day: DailyAppointmentStat[];
}
export interface TopServiceStat {
    service_id: string;
    service_name: string;
    count: number;
}
export interface TopBarberStat {
    barber_id: string;
    full_name: string;
    appointment_count: number;
    avg_rating: number;
}
export interface DailyAppointmentStat {
    date: string;
    total: number;
    completed: number;
    cancelled: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}
export interface ApiError {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
//# sourceMappingURL=index.d.ts.map
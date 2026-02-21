import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, ok } from '@barbershop/shared';

// ── Main Dashboard Stats ──────────────────────────────────────────────────────

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { barbershop_id } = req.query as Record<string, string>;
    const supabase = getSupabaseAdmin();

    const now       = new Date();
    const todayStr  = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const queries = [];

    // Total appointments
    let q1 = supabase.from('appointments').select('*', { count: 'exact', head: true });
    if (barbershop_id) q1 = q1.eq('branch_id', barbershop_id);
    queries.push(q1);

    // Today
    let q2 = supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('appointment_date', todayStr);
    if (barbershop_id) q2 = q2.eq('branch_id', barbershop_id);
    queries.push(q2);

    // Week
    let q3 = supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('appointment_date', weekStart.toISOString().split('T')[0]);
    if (barbershop_id) q3 = q3.eq('branch_id', barbershop_id);
    queries.push(q3);

    // Month
    let q4 = supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('appointment_date', monthStart.toISOString().split('T')[0]);
    if (barbershop_id) q4 = q4.eq('branch_id', barbershop_id);
    queries.push(q4);

    // Skipping cancelled/no_show/completed counts for now because status_id is UUID
    queries.push(Promise.resolve({ count: 0 })); // q5
    queries.push(Promise.resolve({ count: 0 })); // q6
    queries.push(Promise.resolve({ count: 0 })); // q7

    // Active barbers
    let q8 = supabase.from('barbers').select('*', { count: 'exact', head: true }).eq('is_active', true);
    if (barbershop_id) q8 = q8.eq('branch_id', barbershop_id);
    queries.push(q8);

    // Active services
    let q9 = supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true);
    // if (barbershop_id) q9 = q9.eq('barbershop_id', barbershop_id); // check if services have branch_id
    queries.push(q9);

    const [
      totalResult, todayResult, weekResult, monthResult,
      cancelledResult, noShowResult, completedResult,
      barbersResult, servicesResult
    ] = await Promise.all(queries);

    const totalMonth     = (monthResult.count ?? 0) + (cancelledResult.count ?? 0) + (noShowResult.count ?? 0);
    const completionRate = totalMonth > 0
      ? Math.round(((completedResult.count ?? 0) / totalMonth) * 100)
      : 0;

    // Top services this month (simplified - no RPC)
    let servicesQuery = supabase
      .from('appointments')
      .select('service_id, services(id, name)')
      .eq('status', 'completed')
      .gte('appointment_date', monthStart.toISOString().split('T')[0]);
    if (barbershop_id) servicesQuery = servicesQuery.eq('branch_id', barbershop_id);
    
    const { data: serviceData } = await servicesQuery;
    const serviceCounts: Record<string, { name: string; count: number }> = {};
    serviceData?.forEach((a: any) => {
      if (a.service_id && a.services) {
        if (!serviceCounts[a.service_id]) {
          serviceCounts[a.service_id] = { name: a.services.name, count: 0 };
        }
        serviceCounts[a.service_id].count++;
      }
    });
    const topServices = Object.entries(serviceCounts)
      .map(([id, data]) => ({ service_id: id, service_name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top barbers this month
    let barbersQuery = supabase
      .from('appointments')
      .select('barber_id, barbers(id, name, rating)')
      .in('status', ['completed', 'confirmed'])
      .gte('appointment_date', monthStart.toISOString().split('T')[0]);
    if (barbershop_id) barbersQuery = barbersQuery.eq('branch_id', barbershop_id);

    const { data: barberData } = await barbersQuery;
    const barberCounts: Record<string, { name: string; count: number; rating: number }> = {};
    barberData?.forEach((a: any) => {
      if (a.barber_id && a.barbers) {
        if (!barberCounts[a.barber_id]) {
          barberCounts[a.barber_id] = { name: a.barbers.name, count: 0, rating: a.barbers.rating };
        }
        barberCounts[a.barber_id].count++;
      }
    });
    const topBarbers = Object.entries(barberCounts)
      .map(([id, data]) => ({ barber_id: id, name: data.name, appointment_count: data.count, avg_rating: data.rating }))
      .sort((a, b) => b.appointment_count - a.appointment_count)
      .slice(0, 5);

    ok(res, {
      total_appointments:      totalResult.count ?? 0,
      appointments_today:      todayResult.count ?? 0,
      appointments_this_week:  weekResult.count ?? 0,
      appointments_this_month: monthResult.count ?? 0,
      cancelled_this_month:    cancelledResult.count ?? 0,
      no_show_this_month:      noShowResult.count ?? 0,
      completion_rate:         completionRate,
      active_barbers:          barbersResult.count ?? 0,
      active_services:         servicesResult.count ?? 0,
      top_services:            topServices,
      top_barbers:             topBarbers,
    });
  } catch (err) {
    next(err);
  }
}

// ── Appointments by Day (last N days) ─────────────────────────────────────────

export async function getAppointmentsByDay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { barbershop_id, days = '30' } = req.query as Record<string, string>;
    const supabase = getSupabaseAdmin();

    const daysBack = Math.min(Math.max(parseInt(days), 1), 365);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);

    let query = supabase
      .from('appointments')
      .select('appointment_date, status')
      .gte('appointment_date', fromDate.toISOString().split('T')[0])
      .order('appointment_date');

    if (barbershop_id) query = query.eq('branch_id', barbershop_id);

    const { data, error } = await query;
    if (error) throw error;

    // Group by date
    const byDay: Record<string, { total: number; completed: number; cancelled: number }> = {};

    for (const appt of data ?? []) {
      const d = appt.appointment_date;
      if (!byDay[d]) byDay[d] = { total: 0, completed: 0, cancelled: 0 };
      byDay[d].total++;
      if (appt.status === 'completed') byDay[d].completed++;
      if (appt.status === 'cancelled') byDay[d].cancelled++;
    }

    const result = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    ok(res, result);
  } catch (err) {
    next(err);
  }
}

// ── Occupancy Rate Per Barber ─────────────────────────────────────────────────

export async function getOccupancyByBarber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { barbershop_id, date_from, date_to } = req.query as Record<string, string>;
    const supabase = getSupabaseAdmin();

    const from = date_from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const to   = date_to   ?? new Date().toISOString().split('T')[0];

    let query = supabase
      .from('appointments')
      .select('barber_id, status, duration_minutes, barbers(name, photo_url)')
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .not('status', 'in', '("cancelled","no_show")');

    if (barbershop_id) query = query.eq('branch_id', barbershop_id);

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by barber
    const byBarber: Record<string, {
      barber_id: string;
      name: string;
      total_appointments: number;
      total_minutes: number;
      completed: number;
    }> = {};

    for (const appt of data ?? []) {
      const bid = appt.barber_id;
      if (!byBarber[bid]) {
        const b = appt.barbers as unknown as { name: string };
        byBarber[bid] = {
          barber_id: bid,
          name: b?.name ?? 'Unknown',
          total_appointments: 0,
          total_minutes: 0,
          completed: 0,
        };
      }
      byBarber[bid].total_appointments++;
      byBarber[bid].total_minutes += appt.duration_minutes ?? 0;
      if (appt.status === 'completed') byBarber[bid].completed++;
    }

    const result = Object.values(byBarber)
      .sort((a, b) => b.total_appointments - a.total_appointments);

    ok(res, { period: { from, to }, barbers: result });
  } catch (err) {
    next(err);
  }
}

// ── Revenue Estimate (no payments — based on service prices × completed appts) ─

export async function getRevenueEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { barbershop_id, month } = req.query as Record<string, string>;
    const supabase = getSupabaseAdmin();

    const targetMonth = month ?? new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const [year, mon] = targetMonth.split('-').map(Number);
    const from = new Date(year, mon - 1, 1).toISOString();
    const to   = new Date(year, mon, 0, 23, 59, 59).toISOString();

    let query = supabase
      .from('appointments')
      .select('service_id, services(price, name)')
      .eq('status', 'completed')
      .gte('appointment_date', from)
      .lte('appointment_date', to);

    if (barbershop_id) query = query.eq('branch_id', barbershop_id);

    const { data, error } = await query;
    if (error) throw error;

    let totalRevenue = 0;
    const byService: Record<string, { name: string; count: number; revenue: number }> = {};

    for (const appt of data ?? []) {
      const svc = appt.services as unknown as { price: number; name: string };
      if (!svc) continue;

      totalRevenue += svc.price;
      const key = appt.service_id;
      if (!byService[key]) byService[key] = { name: svc.name, count: 0, revenue: 0 };
      byService[key].count++;
      byService[key].revenue += svc.price;
    }

    ok(res, {
      month: targetMonth,
      total_estimated_revenue: totalRevenue,
      completed_appointments: data?.length ?? 0,
      breakdown_by_service: Object.values(byService).sort((a, b) => b.revenue - a.revenue),
      note: 'Revenue is estimated based on service prices. Actual payment is collected in-person.',
    });
  } catch (err) {
    next(err);
  }
}

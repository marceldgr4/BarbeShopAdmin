import { Request, Response, NextFunction } from 'express';
import {
  getSupabaseAdmin, ok, created, noContent, paginated,
  parsePagination, auditLog,
} from '@barbershop/shared';
import type { CreateBarberInput, UpdateBarberInput, ListBarbersQuery } from '../validators/barber.validator';

const TABLE = 'barbers';

// ── List ──────────────────────────────────────────────────────────────────────

export async function listBarbers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListBarbersQuery;
    const { page, limit, offset } = parsePagination(req.query);
    const supabase = getSupabaseAdmin();

    let dbQuery = supabase
      .from(TABLE)
      .select('*, branches(name)', { count: 'exact' })
      .order(query.sort_by ?? 'created_at', { ascending: query.sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (query.barbershop_id) {
      dbQuery = dbQuery.eq('branch_id', query.barbershop_id);
    }
    if (query.search) {
      dbQuery = dbQuery.ilike('name', `%${query.search}%`);
    }
    if (query.is_active !== undefined) {
      dbQuery = dbQuery.eq('is_active', query.is_active === 'true');
    }

    const { data, error, count } = await dbQuery;
    if (error) throw error;

    paginated(res, data ?? [], count ?? 0, { page, limit });
  } catch (err) {
    next(err);
  }
}

// ── Get By ID ─────────────────────────────────────────────────────────────────

export async function getBarber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(TABLE)
      .select('*, branches(id, name, address, city)')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Barber not found' });
      return;
    }

    ok(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createBarber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateBarberInput;
    const supabase = getSupabaseAdmin();

    // Validate that barbershop exists
    const { data: shop } = await supabase
      .from('branches')
      .select('id')
      .eq('id', body.barbershop_id)
      .single();

    if (!shop) {
      res.status(400).json({ success: false, error: 'Barbershop not found' });
      return;
    }

    // Validate user exists in Supabase Auth
    const { data: authUser } = await supabase.auth.admin.getUserById(body.user_id);
    if (!authUser.user) {
      res.status(400).json({ success: false, error: 'User not found in auth system' });
      return;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...body, rating: 0, review_count: 0, is_active: true })
      .select()
      .single();

    if (error) throw error;

    // Update the user's role to 'barber' in profiles
    await supabase
      .from('profiles')
      .update({ role: 'barber', branch_id: body.barbershop_id })
      .eq('id', body.user_id);

    await auditLog(req, { action: 'create', resource: TABLE, resource_id: data.id, new_value: body });

    created(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateBarber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as UpdateBarberInput;
    const supabase = getSupabaseAdmin();

    const { data: old } = await supabase.from(TABLE).select().eq('id', id).single();
    if (!old) {
      res.status(404).json({ success: false, error: 'Barber not found' });
      return;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditLog(req, { action: 'update', resource: TABLE, resource_id: id, old_value: old, new_value: body });

    ok(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Toggle Active ─────────────────────────────────────────────────────────────

export async function toggleBarberActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data: current } = await supabase.from(TABLE).select('is_active').eq('id', id).single();
    if (!current) {
      res.status(404).json({ success: false, error: 'Barber not found' });
      return;
    }

    const newStatus = !current.is_active;
    const { data, error } = await supabase
      .from(TABLE)
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditLog(req, {
      action: 'status_change',
      resource: TABLE,
      resource_id: id,
      old_value: { is_active: current.is_active },
      new_value: { is_active: newStatus },
    });

    ok(res, data, `Barber ${newStatus ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
}

// ── Get Barber Stats ──────────────────────────────────────────────────────────

export async function getBarberStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [totalResult, monthResult, ratingResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('barber_id', id)
        .eq('status', 'completed'),

      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('barber_id', id)
        .gte('appointment_date', firstOfMonth)
        .in('status', ['completed', 'confirmed', 'pending']),

      supabase
        .from('reviews')
        .select('rating')
        .eq('barber_id', id),
    ]);

    const ratings = ratingResult.data ?? [];
    const avgRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    ok(res, {
      total_completed_appointments: totalResult.count ?? 0,
      appointments_this_month: monthResult.count ?? 0,
      avg_rating: Math.round(avgRating * 10) / 10,
      review_count: ratings.length,
    });
  } catch (err) {
    next(err);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteBarber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { count: activeAppts } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('barber_id', id)
      .in('status', ['pending', 'confirmed']);

    if (activeAppts && activeAppts > 0) {
      res.status(409).json({
        success: false,
        error: `Cannot delete: ${activeAppts} active appointment(s) assigned to this barber`,
      });
      return;
    }

    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;

    await auditLog(req, { action: 'delete', resource: TABLE, resource_id: id });

    noContent(res);
  } catch (err) {
    next(err);
  }
}

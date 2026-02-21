import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, ok, created, noContent, paginated, parsePagination, auditLog } from '@barbershop/shared';
import type { CreateBarbershopInput, UpdateBarbershopInput, ListBarbershopsQuery } from '../validators/barbershop.validator';

const TABLE = 'branches';

// ── List ──────────────────────────────────────────────────────────────────────

export async function listBarbershops(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as unknown as ListBarbershopsQuery;
    const { page, limit, offset } = parsePagination(req.query);
    const supabase = getSupabaseAdmin();

    let dbQuery = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order(query.sort_by ?? 'created_at', { ascending: query.sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (query.search) {
      dbQuery = dbQuery.or(`name.ilike.%${query.search}%,address.ilike.%${query.search}%`);
    }
    if (query.city) {
      dbQuery = dbQuery.ilike('city', `%${query.city}%`);
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

export async function getBarbershop(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        barbers (id, name, is_active, photo_url, rating),
        services (id, name, price, duration_minutes, is_active)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Barbershop not found' });
      return;
    }

    ok(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createBarbershop(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as CreateBarbershopInput;
    const supabase = getSupabaseAdmin();

    // Default coordinates for Barranquilla if not provided
    const payload = {
      ...body,
      latitude: body.latitude ?? 10.9878,
      longitude: body.longitude ?? -74.7889,
      phone: body.phone ?? '+57 000 000 0000',
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await auditLog(req, {
      action: 'create',
      resource: TABLE,
      resource_id: data.id,
      new_value: body,
    });

    created(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateBarbershop(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as UpdateBarbershopInput;
    const supabase = getSupabaseAdmin();

    // Fetch old value for audit
    const { data: old } = await supabase.from(TABLE).select().eq('id', id).single();
    if (!old) {
      res.status(404).json({ success: false, error: 'Barbershop not found' });
      return;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditLog(req, {
      action: 'update',
      resource: TABLE,
      resource_id: id,
      old_value: old,
      new_value: body,
    });

    ok(res, data);
  } catch (err) {
    next(err);
  }
}

// ── Toggle Active ─────────────────────────────────────────────────────────────

export async function toggleBarbershopActive(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data: current } = await supabase.from(TABLE).select('is_active').eq('id', id).single();
    if (!current) {
      res.status(404).json({ success: false, error: 'Barbershop not found' });
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

    ok(res, data, `Barbershop ${newStatus ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteBarbershop(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    // Soft check: prevent deleting if there are active/pending appointments
    const { count: activeAppts } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', id)
      .in('status', ['pending', 'confirmed']);

    if (activeAppts && activeAppts > 0) {
      res.status(409).json({
        success: false,
        error: `Cannot delete: ${activeAppts} active appointment(s) exist`,
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

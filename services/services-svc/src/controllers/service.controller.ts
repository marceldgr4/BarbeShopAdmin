import { Request, Response, NextFunction } from 'express';
import {
  getSupabaseAdmin, ok, created, noContent, paginated,
  parsePagination, auditLog,
} from '@barbershop/shared';
import type { CreateServiceInput, UpdateServiceInput, ListServicesQuery } from '../validators/service.validator';

const TABLE = 'services';

export async function listServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListServicesQuery;
    const { page, limit, offset } = parsePagination(req.query);
    const supabase = getSupabaseAdmin();

    let dbQuery = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order(query.sort_by ?? 'created_at', { ascending: query.sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (query.search)        dbQuery = dbQuery.ilike('name', `%${query.search}%`);
    if (query.barbershop_id) dbQuery = dbQuery.eq('branch_id', query.barbershop_id);
    if (query.is_active !== undefined) dbQuery = dbQuery.eq('is_active', query.is_active === 'true');
    if (query.min_price !== undefined) dbQuery = dbQuery.gte('price', query.min_price);
    if (query.max_price !== undefined) dbQuery = dbQuery.lte('price', query.max_price);

    const { data, error, count } = await dbQuery;
    if (error) throw error;

    paginated(res, data ?? [], count ?? 0, { page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateServiceInput;
    const supabase = getSupabaseAdmin();

    const { data: shop } = await supabase.from('branches').select('id').eq('id', body.barbershop_id).single();
    if (!shop) {
      res.status(400).json({ success: false, error: 'Barbershop not found' });
      return;
    }

    const { data, error } = await supabase.from(TABLE).insert(body).select().single();
    if (error) throw error;

    await auditLog(req, { action: 'create', resource: TABLE, resource_id: data.id, new_value: body });
    created(res, data);
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as UpdateServiceInput;
    const supabase = getSupabaseAdmin();

    const { data: old } = await supabase.from(TABLE).select().eq('id', id).single();
    if (!old) {
      res.status(404).json({ success: false, error: 'Service not found' });
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

export async function toggleServiceActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data: current } = await supabase.from(TABLE).select('is_active').eq('id', id).single();
    if (!current) {
      res.status(404).json({ success: false, error: 'Service not found' });
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
      action: 'status_change', resource: TABLE, resource_id: id,
      old_value: { is_active: current.is_active }, new_value: { is_active: newStatus },
    });
    ok(res, data, `Service ${newStatus ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { count: usageCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', id)
      .in('status', ['pending', 'confirmed']);

    if (usageCount && usageCount > 0) {
      res.status(409).json({ success: false, error: `Service has ${usageCount} active appointment(s)` });
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

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabaseAdmin } from '../supabase/client';
import type { AuthUser, UserRole } from '../types';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ── Token Verification ────────────────────────────────────────────────────────

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Attaches the decoded user to req.user.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // ── Development Bypass ──────────────────────────────────────────────────
    if (process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@example.com',
        role: 'admin',
      };
      return next();
    }

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Missing authorization token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({ success: false, error: 'Server misconfiguration' });
      return;
    }

    // Verify JWT signature with Supabase JWT secret
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    // Fetch the user's metadata from Supabase to get role
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role, branch_id')
      .eq('id', decoded.sub)
      .single();

    if (error || !profile) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      branch_id: profile.branch_id,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }
    next(err);
  }
}

// ── Role Authorization ────────────────────────────────────────────────────────

/**
 * Middleware factory — only allows users with the specified role(s) through.
 * Must be used AFTER `authenticate`.
 *
 * @example
 * router.get('/stats', authenticate, requireRole('admin'), dashboardController.getStats)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Ensures the admin can only access resources belonging to their barbershop.
 * Super-admins (no branch_id) can access everything.
 */
export function scopeToBarbershop(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  // If the admin is scoped to a barbershop, inject it into the query
  if (req.user.branch_id) {
    req.query.branch_id = req.user.branch_id;
  }

  next();
}

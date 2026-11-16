import { NextResponse } from 'next/server';
import { requireAdmin, supabaseService } from '@/lib/supabase/server';

export const runtime = 'nodejs';
const ROLES = ['super_admin', 'recruiter', 'viewer'];

// Create a new admin user (super admins only).
export async function POST(req: Request) {
  const ctx = await requireAdmin(['super_admin']);
  if ('error' in ctx) return ctx.error;

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.full_name || '').trim().slice(0, 120);
  const password = String(body.password || '');
  const role = String(body.role || 'recruiter');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  if (password.length < 10) return NextResponse.json({ error: 'The temporary password must be at least 10 characters.' }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });

  const db = supabaseService();
  const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !created.user) {
    return NextResponse.json({ error: error?.message || 'Could not create the user.' }, { status: 400 });
  }
  const { error: insertError } = await db.from('admin_users')
    .insert({ id: created.user.id, email, full_name: fullName || null, role });
  if (insertError) {
    await db.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: 'Could not save the admin profile.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Change role or activate / deactivate an admin (super admins only).
export async function PATCH(req: Request) {
  const ctx = await requireAdmin(['super_admin']);
  if ('error' in ctx) return ctx.error;

  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
  if (body.id === ctx.admin.id) {
    return NextResponse.json({ error: 'You cannot change your own role or status.' }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.role === 'string' && ROLES.includes(body.role)) patch.role = body.role;
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const { error } = await supabaseService().from('admin_users').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

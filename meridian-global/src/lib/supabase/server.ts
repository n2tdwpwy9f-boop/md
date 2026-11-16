import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => Boolean(URL && ANON);

// Anonymous server client for public master data (countries, categories, published vacancies).
export function supabasePublic(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

// Service-role client. Bypasses RLS. SERVER ONLY: never import this from a client component.
export function supabaseService(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !key) throw new Error('Supabase is not configured (missing URL or service role key).');
  return createClient(URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Client bound to the signed-in admin's session cookies (RLS applies).
export function supabaseSession(): SupabaseClient {
  const store = cookies();
  return createServerClient(URL || 'http://localhost:54321', ANON || 'missing-anon-key', {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: any }[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a context where cookies are read-only */
        }
      },
    },
  });
}

type AdminContext = {
  supabase: SupabaseClient;
  admin: { id: string; email: string; full_name: string | null; role: string };
};

// Guard for admin API routes. Returns the admin context or a ready-to-return error response.
export async function requireAdmin(roles?: string[]): Promise<AdminContext | { error: NextResponse }> {
  const supabase = supabaseSession();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) };
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id,email,full_name,role,is_active')
    .eq('id', user.id)
    .maybeSingle();
  if (!admin || !admin.is_active) {
    return { error: NextResponse.json({ error: 'Not authorised.' }, { status: 403 }) };
  }
  if (roles && !roles.includes(admin.role)) {
    return { error: NextResponse.json({ error: 'Your role does not allow this action.' }, { status: 403 }) };
  }
  return { supabase, admin };
}

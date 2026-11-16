'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Briefcase, Building2, Globe, LayoutDashboard, LogOut, Mail, Menu, Settings, Tags, Users, X } from 'lucide-react';
import { site } from '@/config/site';
import { ROLES } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Spinner } from './ui';

type Admin = { id: string; email: string; full_name: string | null; role: string };
type Ctx = {
  admin: Admin;
  canEdit: boolean;   // super_admin or recruiter
  isSuper: boolean;
  lists: { countries: string[]; categories: string[] };
  reloadLists: () => void;
};

const AdminContext = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/candidates', label: 'Candidates', icon: Users },
  { href: '/admin/requirements', label: 'Employer Requirements', icon: Building2 },
  { href: '/admin/countries', label: 'Countries', icon: Globe },
  { href: '/admin/categories', label: 'Job Categories', icon: Tags },
  { href: '/admin/communications', label: 'Communications', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'denied' | 'ready'>('loading');
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [lists, setLists] = useState({ countries: [] as string[], categories: [] as string[] });
  const [open, setOpen] = useState(false);

  const reloadLists = useCallback(async () => {
    const db = supabaseBrowser();
    const [c, j] = await Promise.all([
      db.from('countries').select('name').eq('is_active', true).order('sort_order').order('name'),
      db.from('job_categories').select('name').eq('is_active', true).order('sort_order').order('name'),
    ]);
    setLists({ countries: (c.data || []).map((x) => x.name), categories: (j.data || []).map((x) => x.name) });
  }, []);

  useEffect(() => {
    (async () => {
      const db = supabaseBrowser();
      const { data: { user } } = await db.auth.getUser();
      if (!user) return router.replace('/admin/login');
      const { data } = await db.from('admin_users').select('id,email,full_name,role,is_active').eq('id', user.id).maybeSingle();
      if (!data || !data.is_active) return setState('denied');
      setAdmin(data);
      await reloadLists();
      setState('ready');
    })();
  }, [router, reloadLists]);

  useEffect(() => setOpen(false), [pathname]);

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    window.location.href = '/admin/login';
  };

  if (state === 'loading') return <div className="min-h-screen bg-navy-50"><Spinner label="Loading dashboard…" /></div>;
  if (state === 'denied' || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold text-navy-900">Access not authorised</h1>
          <p className="mt-2 text-sm text-navy-500">
            Your account is signed in but is not an active admin user. Ask a super admin to grant you access.
          </p>
          <button className="btn-navy mt-6" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const ctx: Ctx = {
    admin, lists, reloadLists,
    canEdit: admin.role === 'super_admin' || admin.role === 'recruiter',
    isSuper: admin.role === 'super_admin',
  };

  return (
    <AdminContext.Provider value={ctx}>
      <div className="min-h-screen bg-navy-50/70 lg:flex">
        <div className="flex items-center justify-between bg-brand-500 px-4 py-3 text-white lg:hidden">
          <span className="font-display text-lg font-semibold">{site.name} Admin</span>
          <button onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 bg-brand-500 text-navy-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col`}>
          <div className="hidden border-b border-white/10 px-6 py-5 lg:block">
            <p className="font-display text-xl font-semibold text-white">{site.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">
              <Briefcase className="h-3 w-3" aria-hidden /> Recruitment Admin
            </p>
          </div>
          <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${isActive(n.href) ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#ffffff]' : 'hover:bg-white/5 hover:text-white'}`}>
                <n.icon className="h-4 w-4" aria-hidden /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <p className="truncate text-sm font-semibold text-white">{admin.full_name || admin.email}</p>
            <p className="text-xs text-navy-300">{ROLES.find((r) => r.key === admin.role)?.label}</p>
            <button onClick={signOut} className="mt-3 flex items-center gap-2 text-xs font-bold text-brand-300 hover:text-brand-200">
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminShell';
import { Badge, ErrorNote, Modal, PageHeader, Spinner } from '@/components/admin/ui';
import { ROLES, STATUSES } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';

function Toggle({ checked, onChange, label, help, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; help: string; disabled?: boolean }) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span><span className="block text-sm font-bold text-navy-900">{label}</span><span className="text-xs text-navy-500">{help}</span></span>
    </label>
  );
}

export default function SettingsPage() {
  const { admin, isSuper } = useAdmin();
  const db = supabaseBrowser();
  const [s, setS] = useState<any | null>(null);
  const [emails, setEmails] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [nu, setNu] = useState({ full_name: '', email: '', password: '', role: 'recruiter' });

  const load = useCallback(async () => {
    const [settings, admins] = await Promise.all([
      db.from('notification_settings').select('*').eq('id', 1).maybeSingle(),
      db.from('admin_users').select('*').order('created_at'),
    ]);
    const data = settings.data || { confirm_candidate: true, notify_admins: true, admin_emails: [], status_updates: true, status_update_stages: [] };
    setS(data);
    setEmails((data.admin_emails || []).join(', '));
    setUsers(admins.data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true); setMsg(''); setError('');
    const admin_emails = emails.split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));
    const { error } = await db.from('notification_settings').update({
      confirm_candidate: s.confirm_candidate, notify_admins: s.notify_admins, admin_emails,
      status_updates: s.status_updates, status_update_stages: s.status_update_stages, updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setBusy(false);
    if (error) return setError(error.message);
    setEmails(admin_emails.join(', '));
    setMsg('Notification settings saved.');
  };

  const toggleStage = (key: string) => {
    const list: string[] = s.status_update_stages || [];
    setS({ ...s, status_update_stages: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] });
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nu) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not create the user.');
    setAdding(false);
    setNu({ full_name: '', email: '', password: '', role: 'recruiter' });
    load();
  };

  const patchUser = async (id: string, patch: Record<string, any>) => {
    setError('');
    const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || 'Update failed.');
    load();
  };

  if (!s) return <Spinner />;

  return (
    <>
      <PageHeader title="Settings" subtitle="Email notifications and admin users." />
      {error && !adding && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <section className="card p-6">
        <h2 className="font-sans text-base font-bold text-navy-900">Email notifications</h2>
        {!isSuper && <p className="mt-1 text-xs text-navy-500">Only super admins can change these settings.</p>}
        <div className="mt-5 space-y-5">
          <Toggle disabled={!isSuper} checked={s.confirm_candidate} onChange={(v) => setS({ ...s, confirm_candidate: v })}
            label="Registration confirmation to candidates" help="Email each candidate their Candidate ID after they register." />
          <Toggle disabled={!isSuper} checked={s.notify_admins} onChange={(v) => setS({ ...s, notify_admins: v })}
            label="New registration alerts to administrators" help="Send an alert to the addresses below for every new registration." />
          <label className="block pl-7">
            <span className="label">Administrator alert addresses</span>
            <input className="input" disabled={!isSuper} placeholder="recruitment@yourcompany.com, manager@yourcompany.com" value={emails} onChange={(e) => setEmails(e.target.value)} />
          </label>
          <Toggle disabled={!isSuper} checked={s.status_updates} onChange={(v) => setS({ ...s, status_updates: v })}
            label="Recruitment status updates to candidates" help="Allows staff to email a candidate when their status changes. Staff still choose per update, and only the stages ticked below can be emailed." />
          <fieldset className="pl-7" disabled={!isSuper || !s.status_updates}>
            <legend className="label">Stages that can be emailed to candidates</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {STATUSES.filter((x) => x.key !== 'new').map((x) => (
                <label key={x.key} className="flex items-center gap-2 text-sm text-navy-700">
                  <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={(s.status_update_stages || []).includes(x.key)} onChange={() => toggleStage(x.key)} />
                  {x.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {isSuper && (
          <div className="mt-6 flex items-center gap-3">
            <button className="btn-navy" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save settings</button>
            {msg && <span className="text-sm font-semibold text-green-700" role="status">{msg}</span>}
          </div>
        )}
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="font-sans text-base font-bold text-navy-900">Admin users</h2>
            <p className="text-xs text-navy-500">{ROLES.map((r) => `${r.label}: ${r.help}`).join(' ')}</p>
          </div>
          {isSuper && <button className="btn-navy btn-sm shrink-0" onClick={() => { setError(''); setAdding(true); }}><Plus className="h-4 w-4" aria-hidden /> Add user</button>}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-y border-navy-100 bg-navy-50/70">
              <tr>{['Name', 'Email', 'Role', 'Status', ''].map((h) => <th key={h} className="th first:pl-6">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="td pl-6 font-bold text-navy-900">{u.full_name || '-'}{u.id === admin.id && <span className="ml-2 text-xs font-normal text-navy-400">(you)</span>}</td>
                  <td className="td">{u.email}</td>
                  <td className="td">
                    {isSuper && u.id !== admin.id ? (
                      <select className="input w-auto py-1.5" aria-label={`Role for ${u.email}`} value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })}>
                        {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                    ) : ROLES.find((r) => r.key === u.role)?.label}
                  </td>
                  <td className="td">{u.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}</td>
                  <td className="td pr-6 text-right">
                    {isSuper && u.id !== admin.id && (
                      <button className="btn-outline btn-sm" onClick={() => patchUser(u.id, { is_active: !u.is_active })}>{u.is_active ? 'Deactivate' : 'Reactivate'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adding && (
        <Modal title="Add admin user" onClose={() => setAdding(false)}>
          <form onSubmit={createUser} className="space-y-4">
            <label className="block"><span className="label">Full name</span>
              <input className="input" required value={nu.full_name} onChange={(e) => setNu({ ...nu, full_name: e.target.value })} /></label>
            <label className="block"><span className="label">Email</span>
              <input type="email" className="input" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /></label>
            <label className="block"><span className="label">Temporary password</span>
              <input className="input" required minLength={10} autoComplete="new-password" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
              <span className="mt-1 block text-xs text-navy-400">At least 10 characters. Share it securely and ask the user to change it.</span></label>
            <label className="block"><span className="label">Role</span>
              <select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}: {r.help}</option>)}
              </select></label>
            <ErrorNote>{error}</ErrorNote>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn-navy" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Create user</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

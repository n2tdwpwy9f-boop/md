'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { CATEGORY_ICONS, CategoryIcon } from '@/lib/icons';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useAdmin } from './AdminShell';
import { Badge, ErrorNote, Modal, PageHeader, Spinner } from './ui';

type Props = { table: 'countries' | 'job_categories'; title: string; subtitle: string; singular: string };

// Add / edit / remove screen shared by Countries and Job Categories.
export default function MasterData({ table, title, subtitle, singular }: Props) {
  const { canEdit, reloadLists } = useAdmin();
  const isCountry = table === 'countries';
  const [rows, setRows] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState('');
  const db = supabaseBrowser();

  const load = useCallback(async () => {
    const { data, error } = await db.from(table).select('*').order('sort_order').order('name');
    if (error) setError(error.message);
    setRows(data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
  useEffect(() => { load(); }, [load]);

  const blank = isCountry
    ? { name: '', iso_code: '', description: '', sort_order: (rows?.length || 0) + 1, is_active: true }
    : { name: '', icon: 'briefcase', description: '', sort_order: (rows?.length || 0) + 1, is_active: true };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const row: Record<string, any> = {
      name: editing.name.trim(),
      description: editing.description?.trim() || null,
      sort_order: Number(editing.sort_order) || 0,
      is_active: !!editing.is_active,
    };
    if (isCountry) row.iso_code = editing.iso_code?.trim().toLowerCase() || null;
    else row.icon = editing.icon || 'briefcase';
    const res = editing.id ? await db.from(table).update(row).eq('id', editing.id) : await db.from(table).insert(row);
    if (res.error) return setError(/duplicate/i.test(res.error.message) ? `A ${singular} with this name already exists.` : res.error.message);
    setEditing(null);
    await load();
    reloadLists();
  };

  const remove = async (r: any) => {
    if (!window.confirm(`Remove "${r.name}"? Existing candidate records keep this value, but it will no longer be offered on the website.`)) return;
    const { error } = await db.from(table).delete().eq('id', r.id);
    if (error) return setError(error.message);
    await load();
    reloadLists();
  };

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        {canEdit && <button className="btn-navy" onClick={() => { setError(''); setEditing(blank); }}><Plus className="h-4 w-4" aria-hidden /> Add {singular}</button>}
      </PageHeader>
      {error && !editing && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="card overflow-hidden">
        {rows === null ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-navy-100 bg-navy-50/70">
                <tr>{['Order', isCountry ? 'Flag' : 'Icon', 'Name', 'Description', 'Website', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="td text-navy-400">{r.sort_order}</td>
                    <td className="td">
                      {isCountry
                        // eslint-disable-next-line @next/next/no-img-element
                        ? (r.iso_code ? <img src={`https://flagcdn.com/w40/${r.iso_code}.png`} alt="" className="h-5 w-8 rounded-sm border border-navy-100 object-cover" /> : <span className="text-xs text-navy-400">Globe</span>)
                        : <CategoryIcon name={r.icon} className="h-5 w-5 text-navy-600" />}
                    </td>
                    <td className="td font-bold text-navy-900">{r.name}</td>
                    <td className="td max-w-md text-navy-500">{r.description}</td>
                    <td className="td">{r.is_active ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</td>
                    <td className="td whitespace-nowrap text-right">
                      {canEdit && (
                        <>
                          <button className="btn-outline btn-sm mr-2" onClick={() => { setError(''); setEditing({ ...r, iso_code: r.iso_code || '' }); }} aria-label={`Edit ${r.name}`}><Pencil className="h-3.5 w-3.5" aria-hidden /></button>
                          <button className="btn-outline btn-sm text-red-600" onClick={() => remove(r)} aria-label={`Remove ${r.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={`${editing.id ? 'Edit' : 'Add'} ${singular}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <label className="block"><span className="label">Name</span>
              <input className="input" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            {isCountry ? (
              <label className="block"><span className="label">Country code for the flag</span>
                <input className="input" maxLength={2} placeholder="Two letters, e.g. de, ae, pl. Leave empty for a globe icon." value={editing.iso_code}
                  onChange={(e) => setEditing({ ...editing, iso_code: e.target.value.replace(/[^a-zA-Z]/g, '') })} />
              </label>
            ) : (
              <label className="block"><span className="label">Icon</span>
                <select className="input" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>
                  {Object.keys(CATEGORY_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
            )}
            <label className="block"><span className="label">Description</span>
              <textarea className="input" rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              {isCountry && <span className="mt-1 block text-xs text-navy-400">Describe areas of interest. Do not state that vacancies are available unless you have published verified requirements.</span>}
            </label>
            <div className="flex items-center gap-6">
              <label className="block w-28"><span className="label">Display order</span>
                <input type="number" className="input" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />
              </label>
              <label className="mt-6 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Show on the website and registration form
              </label>
            </div>
            <ErrorNote>{error}</ErrorNote>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-navy">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

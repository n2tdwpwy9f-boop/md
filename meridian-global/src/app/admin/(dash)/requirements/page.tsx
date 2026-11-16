'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminShell';
import RequirementForm from '@/components/admin/RequirementForm';
import { Badge, PageHeader, Spinner, fmtDate } from '@/components/admin/ui';
import { REQUIREMENT_STATUSES } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';

const TONE: Record<string, string> = { open: 'green', draft: 'gray', on_hold: 'gold', filled: 'emerald', closed: 'red' };

export default function RequirementsPage() {
  const { canEdit } = useAdmin();
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setRows(null);
    let q = supabaseBrowser().from('employer_requirements')
      .select('*, requirement_shortlists(count)').order('created_at', { ascending: false }).limit(500);
    if (status) q = q.eq('status', status);
    const { data } = await q;
    setRows(data || []);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Employer Requirements" subtitle="Manpower requirements shared by employers. Open one to match and shortlist candidates.">
        <select className="input w-auto py-2" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {REQUIREMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        {canEdit && <button className="btn-navy" onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden /> New requirement</button>}
      </PageHeader>

      <div className="card overflow-hidden">
        {rows === null ? <Spinner /> : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-navy-400">No employer requirements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-navy-100 bg-navy-50/70">
                <tr>{['Ref', 'Position', 'Employer', 'Country', 'Category', 'Workers', 'Shortlisted', 'Deadline', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-50/50">
                    <td className="td font-mono text-xs font-bold"><Link className="hover:underline" href={`/admin/requirements/${r.id}`}>{r.requirement_code}</Link></td>
                    <td className="td font-bold"><Link className="text-navy-900 hover:underline" href={`/admin/requirements/${r.id}`}>{r.job_position}</Link></td>
                    <td className="td">{r.employer_name}</td>
                    <td className="td">{r.destination_country}</td>
                    <td className="td">{r.job_category}</td>
                    <td className="td">{r.workers_required}</td>
                    <td className="td">{r.requirement_shortlists?.[0]?.count ?? 0}</td>
                    <td className="td whitespace-nowrap">{fmtDate(r.application_deadline)}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={TONE[r.status]}>{REQUIREMENT_STATUSES.find((s) => s.key === r.status)?.label}</Badge>
                        {r.is_published && <Badge tone="gold">Published</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && <RequirementForm onClose={() => setCreating(false)} onSaved={(id) => router.push(`/admin/requirements/${id}`)} />}
    </>
  );
}

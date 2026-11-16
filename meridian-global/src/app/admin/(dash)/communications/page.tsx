'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, PageHeader, Spinner, fmtDateTime } from '@/components/admin/ui';
import { supabaseBrowser } from '@/lib/supabase/browser';

const PAGE_SIZE = 30;

export default function CommunicationsPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [channel, setChannel] = useState('');

  const load = useCallback(async () => {
    setRows(null);
    let q = supabaseBrowser().from('communications')
      .select('*, candidates(id,full_name,candidate_code)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (channel) q = q.eq('channel', channel);
    const { data, count } = await q;
    setRows(data || []);
    setCount(count || 0);
  }, [page, channel]);
  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Communications" subtitle="Every email sent by the system and every call or message logged by staff.">
        <select className="input w-auto py-2" aria-label="Filter by channel" value={channel} onChange={(e) => { setPage(0); setChannel(e.target.value); }}>
          <option value="">All channels</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
        </select>
      </PageHeader>
      <div className="card overflow-hidden">
        {rows === null ? <Spinner /> : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-navy-400">No communication recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-navy-100 bg-navy-50/70">
                <tr>{['Date', 'Channel', 'Candidate / Recipient', 'Subject', 'Result', 'By'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="td whitespace-nowrap text-xs">{fmtDateTime(m.created_at)}</td>
                    <td className="td"><Badge tone="blue">{m.channel}</Badge></td>
                    <td className="td">
                      {m.candidates
                        ? <Link className="font-bold text-navy-900 hover:underline" href={`/admin/candidates/${m.candidates.id}`}>{m.candidates.full_name}</Link>
                        : <span className="font-bold">Admin notification</span>}
                      <p className="text-xs text-navy-400">{m.recipient}</p>
                    </td>
                    <td className="td max-w-sm">{m.subject}{m.error && <p className="text-xs text-red-600">{m.error}</p>}</td>
                    <td className="td"><Badge tone={m.status === 'sent' ? 'green' : m.status === 'failed' ? 'red' : 'gray'}>{m.status}</Badge></td>
                    <td className="td text-xs text-navy-500">{m.created_by_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm">
          <span className="text-navy-500">Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" aria-hidden /> Previous</button>
            <button className="btn-outline btn-sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" aria-hidden /></button>
          </div>
        </div>
      </div>
    </>
  );
}

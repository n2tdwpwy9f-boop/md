'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader, Spinner, StatusBadge, fmtDate } from '@/components/admin/ui';
import { STATUSES } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';

const CARDS = [
  { key: 'total', label: 'Total Candidates Registered', href: '/admin/candidates' },
  { key: 'new_7d', label: 'New Registrations (last 7 days)', href: '/admin/candidates?days=7' },
  { key: 'experienced', label: 'Experienced Candidates', href: '/admin/candidates?experience=experienced' },
  { key: 'freshers', label: 'Freshers', href: '/admin/candidates?experience=fresher' },
  { key: 'germany', label: 'Interested in Germany', href: '/admin/candidates?country=Germany' },
  { key: 'uae', label: 'Interested in UAE', href: `/admin/candidates?country=${encodeURIComponent('United Arab Emirates (UAE)')}` },
  { key: 'other_countries', label: 'Interested in Other Countries', href: '/admin/candidates' },
  { key: 'shortlisted', label: 'Shortlisted Candidates', href: '/admin/candidates?status=shortlisted' },
  { key: 'processing', label: 'Candidates Under Processing', href: '/admin/candidates' },
  { key: 'placed', label: 'Successfully Placed Candidates', href: '/admin/candidates?status=deployed' },
];

export default function OverviewPage() {
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const db = supabaseBrowser();
      const [s, r] = await Promise.all([
        db.rpc('dashboard_stats'),
        db.from('candidates')
          .select('id,candidate_code,full_name,preferred_category,preferred_countries,status,created_at')
          .order('created_at', { ascending: false }).limit(8),
      ]);
      if (s.error) setError(s.error.message);
      setStats(s.data || {});
      setRecent(r.data || []);
    })();
  }, []);

  if (!stats) return <Spinner />;
  const byStatus: Record<string, number> = stats.by_status || {};
  const max = Math.max(1, ...Object.values(byStatus));

  return (
    <>
      <PageHeader title="Overview" subtitle="Live figures from the candidate database." />
      {error && <p className="mb-4 text-sm font-semibold text-red-600">Could not load statistics: {error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {CARDS.map((c, i) => (
          <Link key={c.key} href={c.href}
            className={`card p-5 transition hover:border-brand-300 ${i === 0 ? 'bg-brand-500 text-white' : ''}`}>
            <p className={`font-display text-3xl font-semibold ${i === 0 ? 'text-brand-300' : 'text-navy-900'}`}>
              {Number(stats[c.key] || 0).toLocaleString()}
            </p>
            <p className={`mt-1.5 text-xs font-semibold leading-snug ${i === 0 ? 'text-navy-200' : 'text-navy-500'}`}>{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <section className="card p-6">
          <h2 className="font-sans text-base font-bold text-navy-900">Candidates by recruitment status</h2>
          <ul className="mt-5 space-y-3">
            {STATUSES.map((s) => {
              const n = byStatus[s.key] || 0;
              return (
                <li key={s.key}>
                  <Link href={`/admin/candidates?status=${s.key}`} className="group block">
                    <div className="flex justify-between text-xs font-semibold text-navy-600 group-hover:text-navy-900">
                      <span>{s.label}</span><span>{n.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-navy-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="font-sans text-base font-bold text-navy-900">Latest registrations</h2>
            <Link href="/admin/candidates" className="text-xs font-bold text-brand-700 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-6 text-sm text-navy-400">No candidates have registered yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-navy-50">
                  {recent.map((c) => (
                    <tr key={c.id} className="hover:bg-navy-50/60">
                      <td className="td pl-6">
                        <Link href={`/admin/candidates/${c.id}`} className="font-bold text-navy-900 hover:underline">{c.full_name}</Link>
                        <p className="text-xs text-navy-400">{c.candidate_code} · {fmtDate(c.created_at)}</p>
                      </td>
                      <td className="td text-xs text-navy-500">{c.preferred_category}<br />{(c.preferred_countries || []).slice(0, 2).join(', ')}</td>
                      <td className="td pr-6 text-right"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

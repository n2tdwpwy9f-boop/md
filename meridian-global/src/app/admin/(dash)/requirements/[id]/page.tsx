'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Pencil, Sparkles, Trash2, UserMinus, UserPlus, X } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminShell';
import RequirementForm from '@/components/admin/RequirementForm';
import { Badge, ErrorNote, Spinner, StatusBadge, fmtDate } from '@/components/admin/ui';
import { REQUIREMENT_STATUSES } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';

const EARLY_STAGES = ['new', 'under_review', 'suitable'];

function Criterion({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${ok ? 'bg-green-50 text-green-700' : 'bg-navy-50 text-navy-400'}`}>
      {ok ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}{label}
      <span className="sr-only">{ok ? ' matches' : ' does not match'}</span>
    </span>
  );
}

export default function RequirementDetailPage({ params }: { params: { id: string } }) {
  const { admin, canEdit, isSuper } = useAdmin();
  const router = useRouter();
  const db = supabaseBrowser();
  const [r, setR] = useState<any | null | undefined>(undefined);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[] | null>(null);
  const [matching, setMatching] = useState(false);
  const [minScore, setMinScore] = useState(50);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadShortlist = useCallback(async () => {
    const { data } = await db.from('requirement_shortlists')
      .select('id,created_at,added_by_name,candidates(id,candidate_code,full_name,mobile,email,status,experience_years,experience_type,highest_qualification)')
      .eq('requirement_id', params.id).order('created_at', { ascending: false });
    setShortlist(data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const load = useCallback(async () => {
    const { data } = await db.from('employer_requirements').select('*').eq('id', params.id).maybeSingle();
    setR(data);
    await loadShortlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, loadShortlist]);

  useEffect(() => { load(); }, [load]);

  const findMatches = async () => {
    setMatching(true);
    setError('');
    const { data, error } = await db.rpc('match_candidates', { p_requirement: params.id });
    if (error) setError(error.message);
    setMatches(data || []);
    setMatching(false);
  };

  const add = async (c: any) => {
    setBusyId(c.id);
    setError('');
    const { error } = await db.from('requirement_shortlists').insert({
      requirement_id: r.id, candidate_id: c.id, added_by: admin.id, added_by_name: admin.full_name || admin.email,
    });
    if (error && !/duplicate/i.test(error.message)) setError(error.message);
    else if (EARLY_STAGES.includes(c.status)) {
      // Move the candidate forward and record the stage in their history.
      await fetch(`/api/admin/candidates/${c.id}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shortlisted', note: `Shortlisted for ${r.requirement_code} (${r.job_position}, ${r.destination_country})`, notify: false }),
      });
      setMatches((m) => m && m.map((x) => (x.id === c.id ? { ...x, status: 'shortlisted' } : x)));
    }
    await loadShortlist();
    setBusyId('');
  };

  const removeFromShortlist = async (id: string) => {
    setBusyId(id);
    const { error } = await db.from('requirement_shortlists').delete().eq('id', id);
    if (error) setError(error.message);
    await loadShortlist();
    setBusyId('');
  };

  const removeRequirement = async () => {
    if (!window.confirm(`Delete requirement ${r.requirement_code}? Its shortlist will also be removed.`)) return;
    const { error } = await db.from('employer_requirements').delete().eq('id', r.id);
    if (error) return setError(error.message);
    router.push('/admin/requirements');
  };

  if (r === undefined) return <Spinner />;
  if (r === null) return <p className="p-10 text-center text-sm text-navy-500">Requirement not found.</p>;

  const shortlistedIds = new Set(shortlist.map((s) => s.candidates?.id));
  const visible = (matches || []).filter((m) => m.score >= minScore);
  const info: [string, any][] = [
    ['Destination Country', r.destination_country], ['Industry', r.industry], ['Job Category', r.job_category],
    ['Workers Required', r.workers_required], ['Minimum Qualification', r.min_qualification || 'Any'],
    ['Required Experience', Number(r.min_experience_years) > 0 ? `${Number(r.min_experience_years)}+ years` : 'None'],
    ['Salary Range', r.salary_range], ['Employment Type', r.employment_type], ['Application Deadline', fmtDate(r.application_deadline)],
  ];

  return (
    <>
      <Link href="/admin/requirements" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All requirements
      </Link>

      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold text-brand-700">{r.requirement_code}</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">{r.job_position}</h1>
            <p className="mt-1 text-sm text-navy-500">{r.employer_name}</p>
            <div className="mt-3 flex gap-2">
              <Badge tone={r.status === 'open' ? 'green' : 'gray'}>{REQUIREMENT_STATUSES.find((s) => s.key === r.status)?.label}</Badge>
              {r.is_published && <Badge tone="gold">Published on website</Badge>}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button className="btn-navy btn-sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" aria-hidden /> Edit</button>
              {isSuper && <button className="btn-outline btn-sm text-red-600" onClick={removeRequirement}><Trash2 className="h-4 w-4" aria-hidden /> Delete</button>}
            </div>
          )}
        </div>
        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-navy-100 pt-5 sm:grid-cols-3">
          {info.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">{k}</dt>
              <dd className="mt-0.5 text-sm text-navy-800">{v || '-'}</dd>
            </div>
          ))}
          <div className="sm:col-span-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">Required Skills</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {(r.required_skills || []).length ? r.required_skills.map((s: string) => <Badge key={s}>{s}</Badge>) : <span className="text-sm">-</span>}
            </dd>
          </div>
          {r.job_description && <div className="sm:col-span-3"><dt className="text-xs font-bold uppercase tracking-wide text-navy-400">Job Description</dt><dd className="mt-0.5 whitespace-pre-wrap text-sm text-navy-800">{r.job_description}</dd></div>}
          {r.benefits && <div className="sm:col-span-3"><dt className="text-xs font-bold uppercase tracking-wide text-navy-400">Accommodation / Benefits</dt><dd className="mt-0.5 whitespace-pre-wrap text-sm text-navy-800">{r.benefits}</dd></div>}
        </dl>
      </div>

      {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      <section className="card mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-sans text-base font-bold text-navy-900">Shortlist ({shortlist.length} of {r.workers_required} required)</h2>
        </div>
        {shortlist.length === 0 ? <p className="p-6 text-sm text-navy-400">No candidates shortlisted yet. Use the matching below.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-y border-navy-100 bg-navy-50/70">
                <tr>{['Candidate', 'Contact', 'Experience', 'Status', 'Added', ''].map((h) => <th key={h} className="th first:pl-6">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {shortlist.map((s) => s.candidates && (
                  <tr key={s.id}>
                    <td className="td pl-6">
                      <Link href={`/admin/candidates/${s.candidates.id}`} className="font-bold text-navy-900 hover:underline">{s.candidates.full_name}</Link>
                      <p className="font-mono text-xs text-navy-400">{s.candidates.candidate_code}</p>
                    </td>
                    <td className="td text-xs">{s.candidates.mobile}<br />{s.candidates.email}</td>
                    <td className="td">{s.candidates.experience_type === 'fresher' ? 'Fresher' : `${Number(s.candidates.experience_years)} yrs`}</td>
                    <td className="td"><StatusBadge status={s.candidates.status} /></td>
                    <td className="td text-xs text-navy-500">{fmtDate(s.created_at)}<br />{s.added_by_name}</td>
                    <td className="td pr-6 text-right">
                      {canEdit && <button className="btn-outline btn-sm" disabled={busyId === s.id} onClick={() => removeFromShortlist(s.id)}><UserMinus className="h-3.5 w-3.5" aria-hidden /> Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
          <div>
            <h2 className="font-sans text-base font-bold text-navy-900">Candidate matching</h2>
            <p className="text-xs text-navy-500">Score out of 100: category 30, destination 25, experience 20, qualification 10, skills 15.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-navy-500">
              Minimum score
              <select className="input w-auto py-1.5" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
                {[0, 30, 50, 70, 85].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn-gold" onClick={findMatches} disabled={matching}>
              <Sparkles className="h-4 w-4" aria-hidden /> {matches ? 'Refresh matches' : 'Find matching candidates'}
            </button>
          </div>
        </div>
        {matching ? <Spinner label="Matching candidates…" /> : matches === null ? (
          <p className="p-6 text-sm text-navy-400">Run the matching to see registered candidates ranked against this requirement.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-navy-400">No candidates meet this score. Lower the minimum score or review the requirement criteria.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-y border-navy-100 bg-navy-50/70">
                <tr>{['Score', 'Candidate', 'Profile', 'Criteria', 'Status', ''].map((h) => <th key={h} className="th first:pl-6">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {visible.map((m) => (
                  <tr key={m.id} className="hover:bg-navy-50/50">
                    <td className="td pl-6">
                      <span className={`font-display text-xl font-semibold ${m.score >= 70 ? 'text-green-700' : m.score >= 50 ? 'text-brand-700' : 'text-navy-400'}`}>{m.score}</span>
                    </td>
                    <td className="td">
                      <Link href={`/admin/candidates/${m.id}`} className="font-bold text-navy-900 hover:underline">{m.full_name}</Link>
                      <p className="font-mono text-xs text-navy-400">{m.candidate_code}</p>
                    </td>
                    <td className="td text-xs text-navy-600">
                      {m.highest_qualification} · {Number(m.experience_years)} yrs<br />
                      <span className="text-navy-400">{(m.key_skills || []).slice(0, 5).join(', ')}</span>
                    </td>
                    <td className="td">
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        <Criterion ok={m.category_match} label="Category" />
                        <Criterion ok={m.country_match} label="Country" />
                        <Criterion ok={m.experience_match} label="Experience" />
                        <Criterion ok={m.qualification_match} label="Qualification" />
                        {m.skills_total > 0 && <Criterion ok={m.skills_matched > 0} label={`Skills ${m.skills_matched}/${m.skills_total}`} />}
                      </div>
                    </td>
                    <td className="td"><StatusBadge status={m.status} /></td>
                    <td className="td pr-6 text-right">
                      {shortlistedIds.has(m.id) ? <Badge tone="green">Shortlisted</Badge>
                        : canEdit && <button className="btn-navy btn-sm" disabled={busyId === m.id} onClick={() => add(m)}><UserPlus className="h-3.5 w-3.5" aria-hidden /> Shortlist</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && <RequirementForm initial={r} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, RotateCcw, Search } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminShell';
import { PageHeader, Spinner, StatusBadge, fmtDate } from '@/components/admin/ui';
import { QUALIFICATIONS, STATUSES, statusLabel } from '@/lib/constants';
import { downloadCsv, toCsv } from '@/lib/csv';
import { supabaseBrowser } from '@/lib/supabase/browser';

const PAGE_SIZE = 25;
const PROCESSING = ['profile_shared', 'interview_scheduled', 'interview_completed', 'selected', 'documentation', 'visa_processing'];
const EXPERIENCE = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'experienced', label: 'Experienced (any)' },
  { value: '0-2', label: 'Up to 2 years' },
  { value: '2-5', label: '2 to 5 years' },
  { value: '5-10', label: '5 to 10 years' },
  { value: '10+', label: '10+ years' },
];
const EMPTY = { search: '', country: '', category: '', experience: '', qualification: '', status: '', from: '', to: '' };
type Filters = typeof EMPTY;

const arrayLiteral = (v: string) => `{"${v.replace(/(["\\])/g, '\\$1')}"}`;

// Applies the same filters to the table query and the export query.
function applyFilters(q: any, f: Filters) {
  const s = f.search.replace(/[,()%*\\]/g, ' ').trim();
  if (s) q = q.or(`full_name.ilike.%${s}%,mobile.ilike.%${s}%,email.ilike.%${s}%,candidate_code.ilike.%${s}%`);
  if (f.country) q = q.contains('preferred_countries', arrayLiteral(f.country));
  if (f.category) q = q.eq('preferred_category', f.category);
  if (f.qualification) q = q.eq('highest_qualification', f.qualification);
  if (f.status === 'processing') q = q.in('status', PROCESSING);
  else if (f.status) q = q.eq('status', f.status);
  if (f.experience === 'fresher' || f.experience === 'experienced') q = q.eq('experience_type', f.experience);
  else if (f.experience === '10+') q = q.gte('experience_years', 10);
  else if (f.experience) {
    const [min, max] = f.experience.split('-').map(Number);
    q = q.eq('experience_type', 'experienced').gte('experience_years', min).lt('experience_years', max);
  }
  if (f.from) q = q.gte('created_at', `${f.from}T00:00:00`);
  if (f.to) q = q.lte('created_at', `${f.to}T23:59:59`);
  return q;
}

const EXPORT_COLUMNS = [
  ['candidate_code', 'Candidate ID'], ['full_name', 'Name'], ['mobile', 'Mobile'], ['whatsapp', 'WhatsApp'],
  ['email', 'Email'], ['date_of_birth', 'Date of Birth'], ['gender', 'Gender'], ['nationality', 'Nationality'],
  ['current_country', 'Current Country'], ['current_city', 'Current City'],
  ['highest_qualification', 'Qualification'], ['specialization', 'Specialization'], ['institution', 'Institution'],
  ['year_of_passing', 'Year of Passing'], ['certifications', 'Certifications'], ['technical_qualifications', 'Technical Qualifications'],
  ['experience_type', 'Fresher / Experienced'], ['experience_years', 'Experience (years)'], ['job_title', 'Job Title'],
  ['previous_company', 'Previous Company'], ['industry', 'Industry'], ['key_skills', 'Key Skills'], ['languages', 'Languages'],
  ['professional_license', 'Professional License'], ['preferred_countries', 'Preferred Countries'],
  ['preferred_category', 'Job Category'], ['preferred_role', 'Preferred Role'], ['preferred_location', 'Preferred Location'],
  ['employment_type', 'Employment Type'], ['expected_salary', 'Expected Salary'], ['salary_currency', 'Currency'],
  ['current_salary', 'Current Salary'], ['notice_period', 'Notice Period'], ['willing_to_relocate', 'Willing to Relocate'],
  ['passport_status', 'Passport'], ['passport_expiry', 'Passport Expiry'], ['status_label', 'Recruitment Status'],
  ['created_at', 'Registration Date'],
].map(([key, label]) => ({ key, label }));

export default function CandidatesPage() {
  const { lists } = useAdmin();
  const [filters, setFilters] = useState<Filters>(() => {
    // Dashboard cards link here with ?status=, ?country=, ?experience= or ?days=
    const searchParams: Record<string, string | undefined> =
      typeof window === 'undefined' ? {} : Object.fromEntries(new URLSearchParams(window.location.search));
    const from = searchParams.days
      ? new Date(Date.now() - Number(searchParams.days) * 86400000).toISOString().slice(0, 10)
      : '';
    return {
      ...EMPTY, from,
      status: searchParams.status || '', country: searchParams.country || '', experience: searchParams.experience || '',
    };
  });
  const [applied, setApplied] = useState<Filters>(filters);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<any[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setRows(null);
    setError('');
    const base = supabaseBrowser().from('candidates')
      .select('id,candidate_code,full_name,mobile,email,nationality,preferred_countries,preferred_category,experience_type,experience_years,created_at,status', { count: 'exact' });
    const { data, count, error } = await applyFilters(base, applied)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) setError(error.message);
    setRows(data || []);
    setCount(count || 0);
  }, [applied, page]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof Filters, v: string, immediate = true) => {
    const next = { ...filters, [k]: v };
    setFilters(next);
    if (immediate) { setPage(0); setApplied(next); }
  };
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(0); setApplied(filters); };
  const reset = () => { setFilters(EMPTY); setApplied(EMPTY); setPage(0); };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all: any[] = [];
      for (let from = 0; from < 50000; from += 1000) {
        const { data, error } = await applyFilters(supabaseBrowser().from('candidates').select('*'), applied)
          .order('created_at', { ascending: false }).range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      const prepared = all.map((r) => ({ ...r, status_label: statusLabel(r.status), created_at: r.created_at?.slice(0, 10) }));
      downloadCsv(`candidates-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(prepared, EXPORT_COLUMNS));
    } catch (e: any) {
      setError(`Export failed: ${e.message || e}`);
    }
    setExporting(false);
  };

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const select = (k: keyof Filters, label: string, options: { value: string; label: string }[]) => (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-navy-500">{label}</span>
      <select className="input py-2" value={filters[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
  const simple = (list: string[]) => list.map((v) => ({ value: v, label: v }));

  return (
    <>
      <PageHeader title="Candidates" subtitle={`${count.toLocaleString()} candidate${count === 1 ? '' : 's'} match the current filters.`}>
        <button className="btn-outline" onClick={exportCsv} disabled={exporting || count === 0}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          Export to Excel (CSV)
        </button>
      </PageHeader>

      <div className="card mb-5 p-4">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-navy-300" aria-hidden />
            <input className="input pl-9" placeholder="Search by name, phone, email or Candidate ID" aria-label="Search candidates"
              value={filters.search} onChange={(e) => set('search', e.target.value, false)} />
          </div>
          <button className="btn-navy">Search</button>
          <button type="button" className="btn-outline" onClick={reset} aria-label="Reset filters"><RotateCcw className="h-4 w-4" aria-hidden /></button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {select('country', 'Country', simple(lists.countries))}
          {select('category', 'Job category', simple(lists.categories))}
          {select('experience', 'Experience', EXPERIENCE)}
          {select('qualification', 'Qualification', simple(QUALIFICATIONS))}
          {select('status', 'Status', [...STATUSES.map((s) => ({ value: s.key as string, label: s.label as string })), { value: 'processing', label: 'Under processing (all stages)' }])}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-navy-500">Registered from</span>
            <input type="date" className="input py-2" value={filters.from} onChange={(e) => set('from', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-navy-500">Registered to</span>
            <input type="date" className="input py-2" value={filters.to} onChange={(e) => set('to', e.target.value)} />
          </label>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="card overflow-hidden">
        {rows === null ? <Spinner /> : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-navy-400">No candidates match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-navy-100 bg-navy-50/70">
                <tr>
                  {['Candidate ID', 'Candidate Name', 'Mobile Number', 'Email Address', 'Nationality', 'Preferred Country', 'Job Category', 'Experience', 'Registration Date', 'Recruitment Status'].map((h) => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-navy-50/50">
                    <td className="td whitespace-nowrap font-mono text-xs font-bold">
                      <Link href={`/admin/candidates/${c.id}`} className="text-navy-700 hover:underline">{c.candidate_code}</Link>
                    </td>
                    <td className="td font-bold"><Link href={`/admin/candidates/${c.id}`} className="text-navy-900 hover:underline">{c.full_name}</Link></td>
                    <td className="td whitespace-nowrap">{c.mobile}</td>
                    <td className="td">{c.email}</td>
                    <td className="td">{c.nationality || '-'}</td>
                    <td className="td max-w-[200px]">{(c.preferred_countries || []).join(', ')}</td>
                    <td className="td max-w-[180px]">{c.preferred_category}</td>
                    <td className="td whitespace-nowrap">{c.experience_type === 'fresher' ? 'Fresher' : `${Number(c.experience_years)} yrs`}</td>
                    <td className="td whitespace-nowrap">{fmtDate(c.created_at)}</td>
                    <td className="td"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm">
          <span className="text-navy-500">Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
            </button>
            <button className="btn-outline btn-sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

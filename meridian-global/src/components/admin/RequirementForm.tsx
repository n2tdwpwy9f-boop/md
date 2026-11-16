'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EMPLOYMENT_TYPES, QUALIFICATIONS, REQUIREMENT_STATUSES } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useAdmin } from './AdminShell';
import { ErrorNote, Modal } from './ui';

const BLANK = {
  employer_name: '', destination_country: '', industry: '', job_category: '', job_position: '',
  workers_required: 1, min_qualification: '', min_experience_years: 0, required_skills: '',
  salary_range: '', employment_type: '', job_description: '', benefits: '', application_deadline: '',
  status: 'open', is_published: false,
};

export default function RequirementForm({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: (id: string) => void }) {
  const { admin, lists } = useAdmin();
  const [v, setV] = useState<Record<string, any>>(
    initial ? { ...BLANK, ...initial, required_skills: (initial.required_skills || []).join(', '), application_deadline: initial.application_deadline || '' } : BLANK,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, value: any) => setV((x) => ({ ...x, [k]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const row = {
      employer_name: v.employer_name.trim(),
      destination_country: v.destination_country,
      industry: v.industry?.trim() || null,
      job_category: v.job_category,
      job_position: v.job_position.trim(),
      workers_required: Math.max(1, Number(v.workers_required) || 1),
      min_qualification: v.min_qualification || null,
      min_experience_years: Math.max(0, Number(v.min_experience_years) || 0),
      required_skills: String(v.required_skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      salary_range: v.salary_range?.trim() || null,
      employment_type: v.employment_type || null,
      job_description: v.job_description?.trim() || null,
      benefits: v.benefits?.trim() || null,
      application_deadline: v.application_deadline || null,
      status: v.status,
      is_published: !!v.is_published,
    };
    const db = supabaseBrowser();
    const res = initial
      ? await db.from('employer_requirements').update(row).eq('id', initial.id).select('id').single()
      : await db.from('employer_requirements').insert({ ...row, created_by: admin.id }).select('id').single();
    setBusy(false);
    if (res.error) return setError(res.error.message);
    onSaved(res.data.id);
  };

  const text = (k: string, label: string, props: Record<string, any> = {}) => (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...props} />
    </label>
  );
  const select = (k: string, label: string, options: string[] | { key: string; label: string }[], required = false, blank = 'Select…') => (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" required={required} value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)}>
        <option value="">{blank}</option>
        {options.map((o: any) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
  const area = (k: string, label: string) => (
    <label className="block sm:col-span-2">
      <span className="label">{label}</span>
      <textarea className="input" rows={3} value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
    </label>
  );

  return (
    <Modal title={initial ? `Edit ${initial.requirement_code}` : 'New employer requirement'} onClose={onClose} wide>
      <form onSubmit={save}>
        <div className="grid gap-5 sm:grid-cols-2">
          {text('employer_name', 'Company / Employer Name', { required: true })}
          {select('destination_country', 'Destination Country', lists.countries, true)}
          {text('industry', 'Industry')}
          {select('job_category', 'Required Job Category', lists.categories, true)}
          {text('job_position', 'Required Job Position', { required: true })}
          {text('workers_required', 'Number of Workers Required', { type: 'number', min: 1, required: true })}
          {select('min_qualification', 'Minimum Qualification', QUALIFICATIONS, false, 'Any')}
          {text('min_experience_years', 'Required Experience (years)', { type: 'number', min: 0, step: 'any' })}
          <label className="block sm:col-span-2">
            <span className="label">Required Skills</span>
            <input className="input" placeholder="Comma-separated, e.g. TIG welding, pipe fitting" value={v.required_skills} onChange={(e) => set('required_skills', e.target.value)} />
          </label>
          {text('salary_range', 'Salary Range', { placeholder: 'e.g. AED 2,500 - 3,200 per month' })}
          {select('employment_type', 'Employment Type', EMPLOYMENT_TYPES)}
          {area('job_description', 'Job Description')}
          {area('benefits', 'Accommodation / Benefits')}
          {text('application_deadline', 'Application Deadline', { type: 'date' })}
          {select('status', 'Requirement Status', REQUIREMENT_STATUSES, true)}
          <label className="flex items-start gap-3 rounded-md border border-brand-200 bg-brand-50 p-4 text-sm sm:col-span-2">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-500" checked={!!v.is_published} onChange={(e) => set('is_published', e.target.checked)} />
            <span>
              <strong className="text-navy-900">Publish as a verified vacancy on the public website.</strong><br />
              <span className="text-navy-600">Tick only when the employer has confirmed this requirement. The employer name is never shown publicly. Only requirements with status &quot;Open&quot; are displayed.</span>
            </span>
          </label>
        </div>
        <div className="mt-5"><ErrorNote>{error}</ErrorNote></div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-navy" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save requirement
          </button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Download, FileText, Loader2, Mail, MessageCircle, Pencil, Phone, Trash2 } from 'lucide-react';
import FieldInput from '@/components/FieldInput';
import { useAdmin } from '@/components/admin/AdminShell';
import { Badge, ErrorNote, Modal, Spinner, StatusBadge, fmtDate, fmtDateTime } from '@/components/admin/ui';
import { ADDITIONAL_FIELDS, ALL_FIELDS, STEPS, candidateSchema, toFormValues } from '@/lib/candidate-fields';
import { BUCKET, STATUSES, docTypeLabel, statusLabel } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';

const today = () => new Date().toISOString().slice(0, 10);
const show = (v: any) => (v == null || v === '' || (Array.isArray(v) && !v.length) ? '-' : Array.isArray(v) ? v.join(', ') : String(v));

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const { admin, canEdit, isSuper, lists } = useAdmin();
  const router = useRouter();
  const db = supabaseBrowser();

  const [c, setC] = useState<any | null | undefined>(undefined);
  const [docs, setDocs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [comms, setComms] = useState<any[]>([]);
  const [shortlists, setShortlists] = useState<any[]>([]);
  const [modal, setModal] = useState<'' | 'edit' | 'email' | 'log'>('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const [status, setStatus] = useState({ status: '', effective_date: today(), note: '', notify: false });
  const [note, setNote] = useState('');
  const [form, setForm] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState({ subject: '', body: '' });
  const [log, setLog] = useState({ channel: 'phone', subject: '', body: '' });

  const load = useCallback(async () => {
    const id = params.id;
    const [cand, d, h, n, m, s] = await Promise.all([
      db.from('candidates').select('*').eq('id', id).maybeSingle(),
      db.from('candidate_documents').select('*').eq('candidate_id', id).order('created_at'),
      db.from('recruitment_status_history').select('*').eq('candidate_id', id).order('created_at', { ascending: false }),
      db.from('recruitment_notes').select('*').eq('candidate_id', id).order('created_at', { ascending: false }),
      db.from('communications').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('requirement_shortlists').select('id,created_at,employer_requirements(id,requirement_code,job_position,employer_name)').eq('candidate_id', id),
    ]);
    setC(cand.data);
    setDocs(d.data || []);
    setHistory(h.data || []);
    setNotes(n.data || []);
    setComms(m.data || []);
    setShortlists(s.data || []);
    if (cand.data) setStatus((x) => ({ ...x, status: cand.data.status }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  if (c === undefined) return <Spinner />;
  if (c === null) {
    return <p className="p-10 text-center text-sm text-navy-500">Candidate not found. <Link className="font-bold underline" href="/admin/candidates">Back to candidates</Link></p>;
  }

  const who = admin.full_name || admin.email;
  const waNumber = String(c.whatsapp || c.mobile || '').replace(/\D/g, '');

  const run = async (label: string, fn: () => Promise<string | void>) => {
    setBusy(label);
    setError('');
    try {
      const problem = await fn();
      if (problem) setError(problem);
    } catch (e: any) {
      setError(e.message || String(e));
    }
    setBusy('');
  };

  const saveStatus = () => run('status', async () => {
    const res = await fetch(`/api/admin/candidates/${c.id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(status),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || 'Could not update the status.';
    setStatus((s) => ({ ...s, note: '', notify: false, effective_date: today() }));
    await load();
    if (data.email === 'disabled_for_stage') return 'Status saved. No email was sent because notifications are switched off for this stage (see Settings).';
    if (data.email === 'failed') return 'Status saved, but the email could not be sent. See the communication log.';
    if (data.email === 'logged') return 'Status saved. Email logged only: no email provider is configured yet.';
  });

  const addNote = () => run('note', async () => {
    if (!note.trim()) return;
    const { error } = await db.from('recruitment_notes').insert({ candidate_id: c.id, note: note.trim(), created_by: admin.id, created_by_name: who });
    if (error) return error.message;
    setNote('');
    await load();
  });

  const deleteNote = (id: string) => run('note', async () => {
    const { error } = await db.from('recruitment_notes').delete().eq('id', id);
    if (error) return error.message;
    await load();
  });

  const download = (doc: any) => run(`doc-${doc.id}`, async () => {
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
    if (error || !data) return 'This file is not available. The upload may not have completed.';
    window.open(data.signedUrl, '_blank', 'noopener');
  });

  const openEdit = () => { setForm(toFormValues(c)); setFormErrors({}); setModal('edit'); };
  const saveEdit = () => run('edit', async () => {
    const parsed = candidateSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setFormErrors(errs);
      return 'Please correct the highlighted fields.';
    }
    const { error } = await db.from('candidates').update(parsed.data).eq('id', c.id);
    if (error) return error.message;
    setModal('');
    await load();
  });

  const sendEmail = () => run('email', async () => {
    const res = await fetch('/api/admin/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: c.id, ...email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || 'Could not send the email.';
    setModal('');
    setEmail({ subject: '', body: '' });
    await load();
    if (data.status === 'failed') return `The email could not be sent: ${data.error || 'unknown error'}`;
    if (data.status === 'logged') return 'No email provider is configured, so the email was logged but not sent.';
  });

  const saveLog = () => run('log', async () => {
    if (!log.subject.trim()) return 'Please add a short summary.';
    const { error } = await db.from('communications').insert({
      candidate_id: c.id, channel: log.channel, recipient: log.channel === 'email' ? c.email : c.mobile,
      subject: log.subject.trim(), body: log.body.trim() || null, status: 'logged', created_by: admin.id, created_by_name: who,
    });
    if (error) return error.message;
    setModal('');
    setLog({ channel: 'phone', subject: '', body: '' });
    await load();
  });

  const remove = () => {
    if (!window.confirm(`Permanently delete ${c.full_name} (${c.candidate_code}) with all documents, notes and history? This cannot be undone.`)) return;
    run('delete', async () => {
      const res = await fetch(`/api/admin/candidates/${c.id}`, { method: 'DELETE' });
      if (!res.ok) return (await res.json().catch(() => ({}))).error || 'Could not delete the candidate.';
      router.push('/admin/candidates');
    });
  };

  const sections = [...STEPS.map((s) => ({ title: s.title, fields: s.fields })), { title: 'Additional Information', fields: ADDITIONAL_FIELDS }];
  const display = (name: string) => {
    if (name === 'experience_type') return c.experience_type === 'fresher' ? 'Fresher' : 'Experienced';
    if (name === 'passport_status') return ({ yes: 'Yes', no: 'No', applied: 'Applied' } as any)[c.passport_status] || '-';
    if (name === 'date_of_birth' || name === 'passport_expiry') return fmtDate(c[name]);
    return show(c[name]);
  };

  return (
    <>
      <Link href="/admin/candidates" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All candidates
      </Link>

      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold text-brand-700">{c.candidate_code}</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">{c.full_name}</h1>
            <p className="mt-1 text-sm text-navy-500">
              {c.preferred_category} · {c.experience_type === 'fresher' ? 'Fresher' : `${Number(c.experience_years)} years experience`} · Registered {fmtDate(c.created_at)}
            </p>
            <div className="mt-3"><StatusBadge status={c.status} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {waNumber && <a className="btn-outline btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNumber}`}><MessageCircle className="h-4 w-4 text-green-600" aria-hidden /> WhatsApp</a>}
            <a className="btn-outline btn-sm" href={`tel:${c.mobile}`}><Phone className="h-4 w-4" aria-hidden /> Call</a>
            {canEdit && <button className="btn-outline btn-sm" onClick={() => setModal('email')}><Mail className="h-4 w-4" aria-hidden /> Email</button>}
            {canEdit && <button className="btn-navy btn-sm" onClick={openEdit}><Pencil className="h-4 w-4" aria-hidden /> Edit</button>}
            {isSuper && <button className="btn-outline btn-sm text-red-600" onClick={remove} disabled={busy === 'delete'}><Trash2 className="h-4 w-4" aria-hidden /> Delete</button>}
          </div>
        </div>
      </div>

      {error && !modal && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Profile */}
        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.title} className="card p-6">
              <h2 className="font-sans text-base font-bold text-navy-900">{s.title}</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {s.fields.map((f) => (
                  <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
                    <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">{f.label.replace(' (optional)', '')}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-navy-800">{display(f.name)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-base font-bold text-navy-900">Communication record</h2>
              {canEdit && <button className="btn-outline btn-sm" onClick={() => setModal('log')}>Log a call or message</button>}
            </div>
            {comms.length === 0 ? <p className="mt-4 text-sm text-navy-400">No communication recorded yet.</p> : (
              <ul className="mt-4 divide-y divide-navy-50">
                {comms.map((m) => (
                  <li key={m.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{m.channel}</Badge>
                      <Badge tone={m.status === 'sent' ? 'green' : m.status === 'failed' ? 'red' : 'gray'}>{m.status}</Badge>
                      <span className="text-sm font-bold text-navy-900">{m.subject}</span>
                    </div>
                    {m.body && <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-navy-600">{m.body}</p>}
                    {m.error && <p className="mt-1 text-xs text-red-600">{m.error}</p>}
                    <p className="mt-1 text-xs text-navy-400">{fmtDateTime(m.created_at)} · {m.created_by_name || 'System'}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Recruitment column */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-sans text-base font-bold text-navy-900">Recruitment status</h2>
            {canEdit ? (
              <div className="mt-4 space-y-3">
                <select className="input" aria-label="Status" value={status.status} onChange={(e) => setStatus({ ...status, status: e.target.value })}>
                  {STATUSES.map((s, i) => <option key={s.key} value={s.key}>{i + 1}. {s.label}</option>)}
                </select>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-navy-500">Stage date</span>
                  <input type="date" className="input" value={status.effective_date} onChange={(e) => setStatus({ ...status, effective_date: e.target.value })} />
                </label>
                <textarea className="input" rows={2} placeholder="Note for this stage (optional)" aria-label="Stage note"
                  value={status.note} onChange={(e) => setStatus({ ...status, note: e.target.value })} />
                <label className="flex items-center gap-2 text-sm text-navy-600">
                  <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={status.notify} onChange={(e) => setStatus({ ...status, notify: e.target.checked })} />
                  Email this update to the candidate
                </label>
                <button className="btn-navy w-full" onClick={saveStatus} disabled={busy === 'status'}>
                  {busy === 'status' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save status
                </button>
              </div>
            ) : <p className="mt-3 text-sm text-navy-500">Your role is read-only.</p>}

            <h3 className="mt-6 font-sans text-xs font-bold uppercase tracking-wide text-navy-400">Stage history</h3>
            <ol className="mt-3 space-y-4 border-l-2 border-navy-100 pl-4">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" aria-hidden />
                  <p className="text-sm font-bold text-navy-900">{statusLabel(h.status)}</p>
                  <p className="text-xs text-navy-400">{fmtDate(h.effective_date)} · {h.changed_by_name || 'System'}</p>
                  {h.note && <p className="mt-1 whitespace-pre-wrap text-sm text-navy-600">{h.note}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section className="card p-6">
            <h2 className="font-sans text-base font-bold text-navy-900">Documents</h2>
            {!canEdit ? <p className="mt-3 text-sm text-navy-500">Your role does not include access to candidate documents.</p>
              : docs.length === 0 ? <p className="mt-3 text-sm text-navy-400">No documents uploaded.</p> : (
                <ul className="mt-3 divide-y divide-navy-50">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-navy-400" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-navy-900">{docTypeLabel(d.doc_type)}</p>
                          <p className="truncate text-xs text-navy-400">{d.file_name} · {((d.size_bytes || 0) / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button className="btn-outline btn-sm" onClick={() => download(d)} disabled={busy === `doc-${d.id}`}>
                        <Download className="h-3.5 w-3.5" aria-hidden /> Download
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </section>

          {shortlists.length > 0 && (
            <section className="card p-6">
              <h2 className="font-sans text-base font-bold text-navy-900">Shortlisted for</h2>
              <ul className="mt-3 space-y-2">
                {shortlists.map((s) => s.employer_requirements && (
                  <li key={s.id} className="text-sm">
                    <Link className="font-bold text-navy-800 hover:underline" href={`/admin/requirements/${s.employer_requirements.id}`}>
                      {s.employer_requirements.requirement_code} · {s.employer_requirements.job_position}
                    </Link>
                    <span className="text-navy-400"> · {s.employer_requirements.employer_name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-6">
            <h2 className="font-sans text-base font-bold text-navy-900">Internal recruitment notes</h2>
            <p className="text-xs text-navy-400">Visible to staff only. Never shown to the candidate.</p>
            {canEdit && (
              <div className="mt-3">
                <textarea className="input" rows={2} placeholder="Add a note…" aria-label="New note" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn-outline btn-sm mt-2" onClick={addNote} disabled={busy === 'note' || !note.trim()}>Add note</button>
              </div>
            )}
            <ul className="mt-4 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md bg-brand-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-navy-800">{n.note}</p>
                  <p className="mt-1.5 flex justify-between text-xs text-navy-400">
                    <span>{n.created_by_name} · {fmtDateTime(n.created_at)}</span>
                    {(isSuper || n.created_by === admin.id) && <button className="font-bold hover:text-red-600" onClick={() => deleteNote(n.id)}>Delete</button>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {modal === 'edit' && (
        <Modal title={`Edit ${c.full_name}`} onClose={() => setModal('')} wide>
          <div className="grid gap-5 sm:grid-cols-2">
            {ALL_FIELDS.map((f) => (
              <FieldInput key={f.name} field={{ ...f, showIf: undefined }} value={form[f.name]} error={formErrors[f.name]} lists={lists}
                onChange={(name, value) => setForm((v) => ({ ...v, [name]: value }))} />
            ))}
          </div>
          <div className="mt-5"><ErrorNote>{error}</ErrorNote></div>
          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setModal('')}>Cancel</button>
            <button className="btn-navy" onClick={saveEdit} disabled={busy === 'edit'}>
              {busy === 'edit' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save changes
            </button>
          </div>
        </Modal>
      )}

      {modal === 'email' && (
        <Modal title={`Email ${c.full_name}`} onClose={() => setModal('')}>
          <p className="mb-4 text-sm text-navy-500">To: {c.email}. The email is recorded in the communication log.</p>
          <label className="label" htmlFor="em-subject">Subject</label>
          <input id="em-subject" className="input" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
          <label className="label mt-4" htmlFor="em-body">Message</label>
          <textarea id="em-body" className="input" rows={7} value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} />
          <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setModal('')}>Cancel</button>
            <button className="btn-navy" onClick={sendEmail} disabled={busy === 'email' || !email.subject.trim() || !email.body.trim()}>
              {busy === 'email' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Send email
            </button>
          </div>
        </Modal>
      )}

      {modal === 'log' && (
        <Modal title="Log a communication" onClose={() => setModal('')}>
          <label className="label" htmlFor="lg-channel">Channel</label>
          <select id="lg-channel" className="input" value={log.channel} onChange={(e) => setLog({ ...log, channel: e.target.value })}>
            <option value="phone">Phone call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email (sent outside the dashboard)</option>
          </select>
          <label className="label mt-4" htmlFor="lg-subject">Summary</label>
          <input id="lg-subject" className="input" placeholder="e.g. Confirmed availability for interview" value={log.subject} onChange={(e) => setLog({ ...log, subject: e.target.value })} />
          <label className="label mt-4" htmlFor="lg-body">Details (optional)</label>
          <textarea id="lg-body" className="input" rows={4} value={log.body} onChange={(e) => setLog({ ...log, body: e.target.value })} />
          <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setModal('')}>Cancel</button>
            <button className="btn-navy" onClick={saveLog} disabled={busy === 'log'}>Save</button>
          </div>
        </Modal>
      )}
    </>
  );
}

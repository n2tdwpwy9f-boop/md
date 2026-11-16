'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText, Loader2, Upload, X } from 'lucide-react';
import FieldInput from '@/components/FieldInput';
import { ADDITIONAL_FIELDS, STEPS, validateFields } from '@/lib/candidate-fields';
import { BUCKET, DOC_TYPES, checkFile } from '@/lib/constants';
import { supabaseBrowser } from '@/lib/supabase/browser';

const DRAFT_KEY = 'candidate-registration-draft-v1';
const STEP_LABELS = [...STEPS.map((s) => s.short), 'Documents', 'Finish'];
const CONSENTS = [
  { name: 'consent_accuracy', text: 'I confirm that the information I have provided is accurate and complete.' },
  { name: 'consent_storage', text: 'I consent to the secure storage and processing of my information for recruitment purposes, as described in the Privacy Policy.' },
  { name: 'consent_communication', text: 'I consent to receive recruitment-related communication by phone, WhatsApp and email.' },
];

type Props = { countries: string[]; categories: string[] };

export default function RegistrationForm({ countries, categories }: Props) {
  const router = useRouter();
  const lists = { countries, categories };
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({ preferred_countries: [] });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [applyingFor, setApplyingFor] = useState('');
  const loaded = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  // Restore a saved draft so nothing is lost on refresh or when moving between steps.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.values) setValues(draft.values);
        if (typeof draft.step === 'number') setStep(Math.min(draft.step, 3));
      }
    } catch { /* storage unavailable */ }
    // "Apply Now" links pass ?country=, ?category= and ?role=. Pre-select them.
    const q = new URLSearchParams(window.location.search);
    const country = q.get('country');
    const category = q.get('category');
    const role = (q.get('role') || '').slice(0, 120);
    const picked: string[] = [];
    setValues((v) => {
      const next = { ...v };
      if (country && countries.includes(country)) {
        next.preferred_countries = Array.from(new Set([...(v.preferred_countries || []), country]));
      }
      if (category && categories.includes(category)) next.preferred_category = category;
      if (role) next.preferred_role = role;
      return next;
    });
    if (role) picked.push(role);
    if (category && categories.includes(category)) picked.push(category);
    if (country && countries.includes(country)) picked.push(country);
    setApplyingFor(picked.join(' · '));
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step }));
    } catch { /* storage unavailable */ }
  }, [values, step]);

  const onChange = (name: string, value: any) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validateStep = (i: number): Record<string, string> => {
    if (i < STEPS.length) return validateFields(STEPS[i].fields, values);
    if (i === 4) {
      const errs: Record<string, string> = {};
      if (!files.resume) errs.resume = 'Please upload your resume / CV.';
      for (const d of DOC_TYPES) {
        const f = files[d.key];
        const problem = f ? checkFile(d.key, f.name, f.size) : null;
        if (problem) errs[d.key] = problem;
      }
      return errs;
    }
    const errs: Record<string, string> = {};
    for (const c of CONSENTS) if (!values[c.name]) errs[c.name] = 'Please tick this box to continue.';
    return errs;
  };

  const go = (target: number) => {
    setServerError('');
    setStep(target);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next = () => {
    const errs = validateStep(step);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    go(step + 1);
  };

  const pickFile = (key: string, file: File | null) => {
    if (file) {
      const problem = checkFile(key, file.name, file.size);
      if (problem) {
        setErrors((e) => ({ ...e, [key]: problem }));
        return;
      }
    }
    setFiles((f) => ({ ...f, [key]: file }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const submit = async () => {
    // Re-validate every step; jump to the first one with a problem.
    for (let i = 0; i <= 5; i++) {
      const errs = validateStep(i);
      if (Object.values(errs).some(Boolean)) {
        setErrors(errs);
        if (i !== step) go(i);
        return;
      }
    }
    setBusy('Submitting your registration…');
    setServerError('');
    try {
      const documents = DOC_TYPES.filter((d) => files[d.key]).map((d) => ({
        docType: d.key, fileName: files[d.key]!.name, size: files[d.key]!.size, mimeType: files[d.key]!.type,
      }));
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: values, documents, website: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.');
        if (data.fields) {
          setErrors(data.fields);
          const bad = STEPS.findIndex((s) => s.fields.some((f) => data.fields[f.name]));
          if (bad >= 0) go(bad);
        }
        setBusy('');
        return;
      }

      // Upload documents straight to private storage using the one-time signed URLs.
      let failed = 0;
      const storage = supabaseBrowser().storage.from(BUCKET);
      for (const [i, u] of (data.uploads || []).entries()) {
        const file = files[u.docType];
        if (!file) continue;
        setBusy(`Uploading documents (${i + 1} of ${data.uploads.length})…`);
        const { error } = await storage.uploadToSignedUrl(u.path, u.token, file, { contentType: file.type });
        if (error) failed++;
      }
      if ((data.uploads || []).length < documents.length) failed += documents.length - data.uploads.length;

      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      router.push(`/register/success?id=${encodeURIComponent(data.candidateCode)}${failed ? '&docs=incomplete' : ''}`);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setBusy('');
    }
  };

  const total = STEP_LABELS.length;

  return (
    <div ref={top} id="form" className="scroll-mt-28">
      {applyingFor && (
        <p className="mb-6 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-navy-800" role="status">
          <strong>You are applying for:</strong> {applyingFor}. We have pre-selected this in step 4. You can change it there.
        </p>
      )}
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm sm:hidden">
          <span className="font-bold text-navy-900">Step {step + 1} of {total}: {STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-navy-100 sm:hidden" role="progressbar"
          aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
        <ol className="hidden items-start sm:flex">
          {STEP_LABELS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="relative flex flex-1 flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
                {i > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${i <= step ? 'bg-brand-500' : 'bg-navy-100'}`} aria-hidden />}
                <button type="button" disabled={!done} onClick={() => go(i)}
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-brand-500 text-white hover:bg-brand-600' : current ? 'bg-brand-500 text-white ring-4 ring-navy-100' : 'bg-navy-100 text-navy-400'}`}
                  aria-label={`Step ${i + 1}: ${label}${done ? ' (completed, go back)' : ''}`}>
                  {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                </button>
                <span className={`mt-2 text-xs font-semibold ${current ? 'text-navy-900' : 'text-navy-400'}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card p-6 sm:p-9">
        {step < STEPS.length && (
          <>
            <h2 className="text-2xl font-semibold text-navy-900">{STEPS[step].title}</h2>
            <p className="mt-1.5 text-sm text-navy-500">{STEPS[step].intro}</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {STEPS[step].fields.filter((f) => !f.showIf || f.showIf(values)).map((f) => (
                <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} lists={lists} onChange={onChange} />
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-2xl font-semibold text-navy-900">Document Upload</h2>
            <p className="mt-1.5 text-sm text-navy-500">
              Only your resume is required now. Other documents are optional and can be provided later when needed.
              Maximum 5 MB per file. Documents are stored privately and seen only by our recruitment team.
            </p>
            <div className="mt-7 space-y-4">
              {DOC_TYPES.map((d) => {
                const file = files[d.key];
                return (
                  <div key={d.key} className={`rounded-lg border p-4 ${errors[d.key] ? 'border-red-300 bg-red-50/40' : 'border-navy-100'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-navy-900">
                          {d.label}{d.required && <span className="text-red-600"> *</span>}
                        </p>
                        <p className="text-xs text-navy-400">{d.help}</p>
                      </div>
                      {file ? (
                        <div className="flex items-center gap-2 rounded-md bg-navy-50 px-3 py-2 text-sm">
                          <FileText className="h-4 w-4 text-navy-500" aria-hidden />
                          <span className="max-w-[180px] truncate font-semibold">{file.name}</span>
                          <span className="text-xs text-navy-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                          <button type="button" onClick={() => pickFile(d.key, null)} aria-label={`Remove ${d.label}`}
                            className="rounded p-0.5 text-navy-400 hover:bg-navy-100 hover:text-red-600">
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <label className="btn-outline btn-sm cursor-pointer">
                          <Upload className="h-3.5 w-3.5" aria-hidden /> Choose file
                          <input type="file" className="sr-only" accept={d.exts.map((e) => `.${e}`).join(',')}
                            onChange={(e) => { pickFile(d.key, e.target.files?.[0] || null); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                    {errors[d.key] && <p className="mt-2 text-xs font-semibold text-red-600">{errors[d.key]}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-2xl font-semibold text-navy-900">Additional Information</h2>
            <p className="mt-1.5 text-sm text-navy-500">Optional, but it helps our team understand your profile.</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {ADDITIONAL_FIELDS.map((f) => (
                <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} lists={lists} onChange={onChange} />
              ))}
            </div>
            <fieldset className="mt-8 rounded-lg border border-navy-100 bg-navy-50/60 p-5">
              <legend className="px-1 text-sm font-bold text-navy-900">Declaration and consent</legend>
              <div className="space-y-4">
                {CONSENTS.map((c) => (
                  <div key={c.name}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-navy-700">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" checked={!!values[c.name]}
                        onChange={(e) => onChange(c.name, e.target.checked)} />
                      <span>{c.text}</span>
                    </label>
                    {errors[c.name] && <p className="ml-7 mt-1 text-xs font-semibold text-red-600">{errors[c.name]}</p>}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-navy-500">
                Read our <Link href="/privacy-policy" target="_blank" className="font-semibold underline">Privacy Policy</Link>.
                Registration does not guarantee placement, a visa or employment.
              </p>
            </fieldset>
          </>
        )}

        {/* Honeypot field: hidden from people, catches bots */}
        <div className="absolute -left-[9999px]" aria-hidden>
          <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
        </div>

        {serverError && (
          <p role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {serverError}
          </p>
        )}
        {Object.values(errors).some(Boolean) && !serverError && (
          <p role="alert" className="mt-6 text-sm font-semibold text-red-600">Please correct the highlighted fields to continue.</p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-navy-100 pt-6">
          <button type="button" className="btn-outline" onClick={() => go(step - 1)} disabled={step === 0 || !!busy}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </button>
          {step < 5 ? (
            <button type="button" className="btn-navy" onClick={next}>
              Continue <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn-gold" onClick={submit} disabled={!!busy}>
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {busy}</> : 'Submit Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

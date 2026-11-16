import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { registrationSchema } from '@/lib/candidate-fields';
import { BUCKET, DOC_TYPES, MIME_BY_EXT, checkFile, fileExt } from '@/lib/constants';
import { sendEmail, templates } from '@/lib/email';
import { supabaseService } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Basic per-IP throttle (per server instance). Add a CAPTCHA for stronger protection.
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

const fail = (error: string, status = 400, fields?: Record<string, string>) =>
  NextResponse.json({ error, fields }, { status });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Invalid request.');

  // Honeypot: real users never fill this hidden field.
  if (body.website) return NextResponse.json({ candidateCode: 'RECEIVED', uploads: [] });

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (throttled(ip)) return fail('Too many submissions. Please try again in a few minutes.', 429);

  const parsed = registrationSchema.safeParse(body.candidate);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] = issue.message;
    return fail('Some details are missing or invalid. Please review the form.', 400, fields);
  }
  const candidate = parsed.data;

  // Validate declared documents: one file per type, allowed extension, type and size.
  const docs: { docType: string; fileName: string; size: number; mimeType: string }[] =
    Array.isArray(body.documents) ? body.documents.slice(0, DOC_TYPES.length) : [];
  const seen = new Set<string>();
  for (const d of docs) {
    if (!d || typeof d.fileName !== 'string' || typeof d.size !== 'number') return fail('Invalid document details.');
    if (seen.has(d.docType)) return fail('Only one file per document type is allowed.');
    seen.add(d.docType);
    const problem = checkFile(d.docType, d.fileName, d.size, d.mimeType || undefined);
    if (problem) return fail(problem);
  }
  if (!seen.has('resume')) return fail('Please upload your resume / CV.');

  let db;
  try {
    db = supabaseService();
  } catch {
    return fail('Registration is temporarily unavailable. Please try again later.', 503);
  }

  // Preferences must refer to active master data.
  const [{ data: countries }, { data: categories }] = await Promise.all([
    db.from('countries').select('name').eq('is_active', true),
    db.from('job_categories').select('name').eq('is_active', true),
  ]);
  const countryNames = new Set((countries || []).map((c) => c.name));
  const categoryNames = new Set((categories || []).map((c) => c.name));
  if (!candidate.preferred_countries.every((c) => countryNames.has(c))) {
    return fail('Please reselect your preferred destination countries.', 400, { preferred_countries: 'Invalid selection' });
  }
  if (!categoryNames.has(candidate.preferred_category)) {
    return fail('Please reselect your preferred job category.', 400, { preferred_category: 'Invalid selection' });
  }

  const { data: row, error } = await db
    .from('candidates')
    .insert({ ...candidate, consent_at: new Date().toISOString(), source: 'website' })
    .select('id,candidate_code,full_name,email,nationality,preferred_countries,preferred_category,experience_type,experience_years')
    .single();
  if (error || !row) {
    console.error('Candidate insert failed', error);
    return fail('We could not save your registration. Please try again.', 500);
  }

  await db.from('recruitment_status_history').insert({
    candidate_id: row.id, status: 'new', note: 'Registered through the website', changed_by_name: 'System',
  });

  // Issue one-time signed upload URLs. Files go straight to the private bucket, which
  // enforces the size limit and allowed MIME types on Supabase's side.
  const uploads: { docType: string; path: string; token: string }[] = [];
  for (const d of docs) {
    const ext = fileExt(d.fileName);
    const path = `${row.id}/${d.docType}-${randomUUID()}.${ext}`;
    const { data: signed, error: signError } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (signError || !signed) continue;
    await db.from('candidate_documents').insert({
      candidate_id: row.id,
      doc_type: d.docType,
      file_name: d.fileName.replace(/[^\w.\- ()]/g, '_').slice(0, 150),
      storage_path: path,
      mime_type: MIME_BY_EXT[ext],
      size_bytes: d.size,
    });
    uploads.push({ docType: d.docType, path, token: signed.token });
  }

  // Notifications (never block or fail the registration).
  try {
    const { data: settings } = await db.from('notification_settings').select('*').eq('id', 1).maybeSingle();
    const jobs: Promise<unknown>[] = [];
    if (!settings || settings.confirm_candidate) {
      jobs.push(sendEmail({
        to: row.email, candidateId: row.id, template: 'registration_confirmation',
        ...templates.registrationConfirmation(row.full_name, row.candidate_code),
      }));
    }
    if (settings?.notify_admins) {
      for (const to of settings.admin_emails || []) {
        jobs.push(sendEmail({ to, candidateId: row.id, template: 'admin_new_registration', ...templates.adminNewRegistration(row) }));
      }
    }
    await Promise.allSettled(jobs);
  } catch (e) {
    console.error('Notification error', e);
  }

  return NextResponse.json({ candidateCode: row.candidate_code, uploads });
}

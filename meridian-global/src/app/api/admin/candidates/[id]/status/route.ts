import { NextResponse } from 'next/server';
import { STATUS_KEYS } from '@/lib/constants';
import { sendEmail, templates } from '@/lib/email';
import { requireAdmin } from '@/lib/supabase/server';
import { site } from '@/config/site';

export const runtime = 'nodejs';

// Updates a candidate's recruitment status, records the stage in the history
// (with date and note) and optionally emails the candidate.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdmin(['super_admin', 'recruiter']);
  if ('error' in ctx) return ctx.error;
  const { supabase, admin } = ctx;

  const body = await req.json().catch(() => ({}));
  const status = String(body.status || '');
  const note = String(body.note || '').trim().slice(0, 2000) || null;
  const effectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(body.effective_date || '') ? body.effective_date : undefined;
  if (!STATUS_KEYS.includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

  const retention = new Date();
  retention.setMonth(retention.getMonth() + site.retentionMonths);

  const { data: candidate, error } = await supabase
    .from('candidates')
    .update({ status, status_updated_at: new Date().toISOString(), retention_expires_at: retention.toISOString() })
    .eq('id', params.id)
    .select('id,full_name,email,candidate_code')
    .single();
  if (error || !candidate) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });

  await supabase.from('recruitment_status_history').insert({
    candidate_id: candidate.id,
    status,
    note,
    ...(effectiveDate ? { effective_date: effectiveDate } : {}),
    changed_by: admin.id,
    changed_by_name: admin.full_name || admin.email,
  });

  let email: string = 'not_sent';
  if (body.notify) {
    const { data: settings } = await supabase.from('notification_settings').select('*').eq('id', 1).maybeSingle();
    if (settings?.status_updates && (settings.status_update_stages || []).includes(status)) {
      const result = await sendEmail({
        to: candidate.email, candidateId: candidate.id, template: 'status_update',
        createdBy: admin.id, createdByName: admin.full_name || admin.email,
        ...templates.statusUpdate(candidate.full_name, candidate.candidate_code, status),
      });
      email = result.status;
    } else {
      email = 'disabled_for_stage';
    }
  }
  return NextResponse.json({ ok: true, email });
}

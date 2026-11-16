import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Sends an email to a candidate from the dashboard and records it in the communication log.
export async function POST(req: Request) {
  const ctx = await requireAdmin(['super_admin', 'recruiter']);
  if ('error' in ctx) return ctx.error;
  const { supabase, admin } = ctx;

  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject || '').trim().slice(0, 200);
  const text = String(body.body || '').trim().slice(0, 5000);
  if (!body.candidateId || !subject || !text) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
  }

  const { data: candidate } = await supabase.from('candidates').select('id,email').eq('id', body.candidateId).maybeSingle();
  if (!candidate) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });

  const result = await sendEmail({
    to: candidate.email, subject, text, candidateId: candidate.id, template: 'manual',
    createdBy: admin.id, createdByName: admin.full_name || admin.email,
  });
  return NextResponse.json(result);
}

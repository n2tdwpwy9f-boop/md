import { site } from '@/config/site';
import { statusLabel } from './constants';
import { supabaseService } from './supabase/server';

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  candidateId?: string | null;
  template?: string;
  createdBy?: string | null;
  createdByName?: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toHtml(text: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f8ff;font-family:Arial,Helvetica,sans-serif;color:#0b1640">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:#0530AD;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;border-bottom:3px solid #dbe5ff">${esc(site.name)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${esc(text).replace(/\n/g, '<br>')}</td></tr>
<tr><td style="padding:16px 28px;background:#f5f8ff;font-size:12px;color:#5f74b8">${esc(site.legalName)} · ${esc(site.email)}</td></tr>
</table></td></tr></table></body></html>`;
}

// Sends an email through Resend or SMTP (whichever is configured) and records it in
// the communications log. With no provider configured the email is only logged.
export async function sendEmail(args: SendArgs): Promise<{ status: 'sent' | 'failed' | 'logged'; error?: string }> {
  const from = process.env.EMAIL_FROM || `${site.name} <no-reply@example.com>`;
  let status: 'sent' | 'failed' | 'logged' = 'logged';
  let error: string | undefined;

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [args.to], subject: args.subject, text: args.text, html: toHtml(args.text) }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
      status = 'sent';
    } else if (process.env.SMTP_HOST) {
      const nodemailer = (await import('nodemailer')).default;
      const port = Number(process.env.SMTP_PORT || 587);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await transport.sendMail({ from, to: args.to, subject: args.subject, text: args.text, html: toHtml(args.text) });
      status = 'sent';
    }
  } catch (e: any) {
    status = 'failed';
    error = String(e?.message || e).slice(0, 500);
  }

  try {
    await supabaseService().from('communications').insert({
      candidate_id: args.candidateId ?? null,
      channel: 'email',
      recipient: args.to,
      subject: args.subject,
      body: args.text,
      template: args.template ?? null,
      status,
      error: error ?? null,
      created_by: args.createdBy ?? null,
      created_by_name: args.createdByName ?? 'System',
    });
  } catch {
    /* logging must never break the request */
  }
  return { status, error };
}

export const templates = {
  registrationConfirmation: (name: string, code: string) => ({
    subject: `Registration received - Candidate ID ${code}`,
    text: `Dear ${name},

Thank you for registering with ${site.name}.

Your Candidate Registration ID is: ${code}

Your profile has been successfully submitted to our recruitment database. Our recruitment team will review your information and contact you if a suitable employment opportunity matches your qualifications and experience.

Please keep your Candidate ID for future reference. Registration does not guarantee placement, a visa or employment.

We wish you success in your international career journey!

${site.name} Recruitment Team
${site.phone} | ${site.email}`,
  }),

  adminNewRegistration: (c: Record<string, any>) => ({
    subject: `New candidate registration: ${c.full_name} (${c.candidate_code})`,
    text: `A new candidate has registered.

Candidate ID: ${c.candidate_code}
Name: ${c.full_name}
Nationality: ${c.nationality || '-'}
Preferred countries: ${(c.preferred_countries || []).join(', ') || '-'}
Job category: ${c.preferred_category || '-'}
Experience: ${c.experience_type === 'fresher' ? 'Fresher' : `${c.experience_years} years`}

Open the admin dashboard to review the full profile:
${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/admin/candidates/${c.id}`,
  }),

  statusUpdate: (name: string, code: string, status: string) => ({
    subject: `Update on your application - ${code}`,
    text: `Dear ${name},

There is an update on your profile with ${site.name}.

Candidate ID: ${code}
Current status: ${statusLabel(status)}

Our recruitment team will contact you with the next steps where required. This update is for your information and does not by itself guarantee employment or visa approval.

${site.name} Recruitment Team
${site.phone} | ${site.email}`,
  }),
};

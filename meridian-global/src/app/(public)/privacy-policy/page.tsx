import type { Metadata } from 'next';
import { site } from '@/config/site';

export const metadata: Metadata = { title: 'Privacy Policy & Data Retention' };

// NOTE: This is a practical starting template. Have it reviewed against the laws that
// apply to your business (for example GDPR for EU employers, India's DPDP Act, or
// local Gulf regulations) before going live.
const SECTIONS: { title: string; body: (string | string[])[] }[] = [
  {
    title: '1. Who we are',
    body: [`${site.legalName} ("we", "us") is an international manpower and recruitment consultancy. We are responsible for the personal information you submit through this website. Contact: ${site.privacyEmail}.`],
  },
  {
    title: '2. Information we collect',
    body: [
      'We collect only what we need to assess your suitability for overseas employment:',
      [
        'Identity and contact details: name, mobile and WhatsApp numbers, email, date of birth, nationality, location and (optionally) gender and address.',
        'Education, certifications, work experience, skills and languages.',
        'Job preferences: destination countries, category, role, salary expectations, notice period and passport availability.',
        'Documents you choose to upload: your resume and, optionally, passport copy, certificates, licences and a photograph.',
      ],
    ],
  },
  {
    title: '3. How we use your information',
    body: [[
      'To review your profile and maintain it in our candidate database.',
      'To match your profile against manpower requirements shared by employers.',
      'To contact you about recruitment by phone, WhatsApp or email.',
      'To share your profile with a prospective employer when you are being considered for a role.',
      'To support interview, documentation and visa processes if you are selected.',
    ], 'We process your information on the basis of the consent you give when registering. We do not sell your information or use it for unrelated marketing.'],
  },
  {
    title: '4. Who we share it with',
    body: ['Your profile may be shared with employers and their authorised representatives in your preferred destination countries, and with service providers that host our systems under confidentiality obligations. Because employers are located abroad, your information may be transferred outside your country of residence.'],
  },
  {
    title: '5. How we protect it',
    body: ['Candidate records are not publicly accessible. Access is limited to authorised recruitment staff with individual logins and role-based permissions. Documents are kept in private storage and can only be opened by authorised staff through short-lived links.'],
  },
  {
    title: '6. Data retention',
    body: [`We keep your profile for ${site.retentionMonths} months from your registration or from the last recruitment activity on your profile, whichever is later. After that period, profiles that are not part of an active recruitment process are deleted together with their uploaded documents. Records of candidates who have been placed may be kept longer where the law requires it.`],
  },
  {
    title: '7. Your choices',
    body: [`You can ask us at any time to give you a copy of your information, correct it, withdraw your consent, or delete your profile and documents. Email ${site.privacyEmail} with your Candidate ID. We will act on verified requests within 30 days.`],
  },
  {
    title: '8. No guarantee of employment',
    body: ['Registering on this website adds your profile to our database for consideration. It is not a job offer and does not guarantee placement, visa approval or employment.'],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-brand-500 py-12 text-white">
        <div className="container-page">
          <h1 className="text-3xl font-semibold sm:text-4xl">Privacy Policy &amp; Data Retention</h1>
          <p className="mt-3 text-navy-200">How we collect, use, protect and retain candidate information.</p>
        </div>
      </section>
      <div className="container-page max-w-3xl py-14">
        {SECTIONS.map((s) => (
          <section key={s.title} className="mb-9">
            <h2 className="text-xl font-semibold text-navy-900">{s.title}</h2>
            {s.body.map((b, i) =>
              Array.isArray(b) ? (
                <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-navy-600">
                  {b.map((li) => <li key={li}>{li}</li>)}
                </ul>
              ) : (
                <p key={i} className="mt-3 leading-relaxed text-navy-600">{b}</p>
              ),
            )}
          </section>
        ))}
      </div>
    </>
  );
}

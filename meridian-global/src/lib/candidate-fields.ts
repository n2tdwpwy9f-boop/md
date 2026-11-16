import { z } from 'zod';
import {
  CURRENCIES, EMPLOYMENT_TYPES, GENDERS, NOTICE_PERIODS, QUALIFICATIONS, RELOCATE_OPTIONS,
} from './constants';

export type Option = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'date' | 'number' | 'select' | 'textarea' | 'multi' | 'radio';
  required?: boolean;
  options?: Option[];
  optionsKey?: 'countries' | 'categories';
  placeholder?: string;
  help?: string;
  full?: boolean;
  years?: 'birth' | 'future'; // year list for date fields
  showIf?: (v: Record<string, any>) => boolean;
};

const opts = (list: string[]): Option[] => list.map((v) => ({ value: v, label: v }));
const experienced = (v: Record<string, any>) => v.experience_type === 'experienced';

export const STEPS: { title: string; short: string; intro: string; fields: Field[] }[] = [
  {
    title: 'Personal Information',
    short: 'Personal',
    intro: 'Tell us who you are and how our recruitment team can reach you.',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'As written in your passport' },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true, placeholder: '+91 98765 43210', help: 'Include your country code.' },
      { name: 'whatsapp', label: 'WhatsApp Number', type: 'tel', required: true, placeholder: '+91 98765 43210', help: 'Include your country code.' },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, years: 'birth' },
      { name: 'gender', label: 'Gender (optional)', type: 'select', options: opts(GENDERS) },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'current_country', label: 'Current Country', type: 'text', required: true },
      { name: 'current_city', label: 'Current City', type: 'text', required: true },
      { name: 'address', label: 'Complete Address (optional)', type: 'textarea', full: true },
    ],
  },
  {
    title: 'Educational Qualification',
    short: 'Education',
    intro: 'Your highest qualification and any certificates that support your profile.',
    fields: [
      { name: 'highest_qualification', label: 'Highest Qualification', type: 'select', required: true, options: opts(QUALIFICATIONS) },
      { name: 'specialization', label: 'Course / Specialization', type: 'text', placeholder: 'e.g. B.Sc Nursing, Diploma in Civil Engineering' },
      { name: 'institution', label: 'Institution Name', type: 'text' },
      { name: 'year_of_passing', label: 'Year of Passing', type: 'number', placeholder: 'e.g. 2019' },
      { name: 'certifications', label: 'Additional Certifications', type: 'textarea', full: true, placeholder: 'e.g. NEBOSH IGC, B1 German, BLS' },
      { name: 'technical_qualifications', label: 'Technical Qualifications', type: 'textarea', full: true, placeholder: 'e.g. ITI Electrician, 6G welding certification' },
    ],
  },
  {
    title: 'Professional Experience',
    short: 'Experience',
    intro: 'Freshers are welcome. If you have worked before, tell us about your most recent role.',
    fields: [
      {
        name: 'experience_type', label: 'Are you a Fresher or Experienced?', type: 'radio', required: true, full: true,
        options: [{ value: 'fresher', label: 'Fresher' }, { value: 'experienced', label: 'Experienced' }],
      },
      { name: 'experience_years', label: 'Total Years of Experience', type: 'number', required: true, showIf: experienced, placeholder: 'e.g. 4.5' },
      { name: 'job_title', label: 'Current / Previous Job Title', type: 'text', required: true, showIf: experienced },
      { name: 'previous_company', label: 'Previous Company Name', type: 'text', showIf: experienced },
      { name: 'industry', label: 'Industry / Work Sector', type: 'text', showIf: experienced },
      { name: 'key_skills', label: 'Key Skills', type: 'text', required: true, full: true, placeholder: 'e.g. MIG welding, pipe fitting, blueprint reading', help: 'Separate skills with commas.' },
      { name: 'languages', label: 'Languages Known', type: 'text', required: true, full: true, placeholder: 'e.g. English, Hindi, Arabic', help: 'Separate languages with commas.' },
      { name: 'professional_license', label: 'Professional License / Certification (where applicable)', type: 'text', full: true, placeholder: 'e.g. DHA licence, GCC driving licence' },
    ],
  },
  {
    title: 'International Job Preference',
    short: 'Preference',
    intro: 'Where would you like to work, and in what kind of role?',
    fields: [
      { name: 'preferred_countries', label: 'Preferred Destination Country', type: 'multi', required: true, full: true, optionsKey: 'countries', help: 'Select all that apply.' },
      { name: 'preferred_category', label: 'Preferred Job Category', type: 'select', required: true, optionsKey: 'categories' },
      { name: 'preferred_role', label: 'Preferred Job Role', type: 'text', required: true, placeholder: 'e.g. Staff Nurse, Heavy Driver' },
      { name: 'preferred_location', label: 'Preferred Work Location', type: 'text', placeholder: 'City or region, if any' },
      { name: 'employment_type', label: 'Preferred Employment Type', type: 'select', required: true, options: opts(EMPLOYMENT_TYPES) },
      { name: 'expected_salary', label: 'Expected Monthly Salary', type: 'number', required: true },
      { name: 'salary_currency', label: 'Currency Preference', type: 'select', required: true, options: opts(CURRENCIES) },
      { name: 'current_salary', label: 'Current Salary (optional)', type: 'number' },
      { name: 'notice_period', label: 'Notice Period', type: 'select', required: true, options: opts(NOTICE_PERIODS) },
      { name: 'willing_to_relocate', label: 'Willingness to Relocate', type: 'select', required: true, options: opts(RELOCATE_OPTIONS) },
      {
        name: 'passport_status', label: 'Passport Availability', type: 'radio', required: true,
        options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'applied', label: 'Applied' }],
      },
      { name: 'passport_expiry', label: 'Passport Expiry Date (optional)', type: 'date', years: 'future', showIf: (v) => v.passport_status === 'yes' },
    ],
  },
];

export const ADDITIONAL_FIELDS: Field[] = [
  { name: 'introduction', label: 'Brief introduction about yourself', type: 'textarea', full: true },
  { name: 'abroad_motivation', label: 'Why are you interested in working abroad?', type: 'textarea', full: true },
  { name: 'additional_info', label: 'Additional information for our recruitment team', type: 'textarea', full: true },
];

export const ALL_FIELDS: Field[] = [...STEPS.flatMap((s) => s.fields), ...ADDITIONAL_FIELDS];

const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Client-side validation for a group of fields. Returns { fieldName: message }.
export function validateFields(fields: Field[], v: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.showIf && !f.showIf(v)) continue;
    const val = v[f.name];
    const empty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
    if (empty) {
      if (f.required) errors[f.name] = 'This field is required.';
      continue;
    }
    if (f.type === 'email' && !EMAIL_RE.test(String(val))) errors[f.name] = 'Enter a valid email address.';
    if (f.type === 'tel' && !PHONE_RE.test(String(val))) errors[f.name] = 'Enter a valid phone number with country code.';
    if (f.type === 'number' && (isNaN(Number(val)) || Number(val) < 0)) errors[f.name] = 'Enter a valid number.';
  }
  if (v.date_of_birth && fields.some((f) => f.name === 'date_of_birth') && !isAdult(v.date_of_birth)) {
    errors.date_of_birth = 'You must be at least 18 years old to register.';
  }
  const y = Number(v.year_of_passing);
  if (v.year_of_passing && fields.some((f) => f.name === 'year_of_passing') && (y < 1950 || y > new Date().getFullYear() + 1)) {
    errors.year_of_passing = 'Enter a valid year.';
  }
  return errors;
}

function isAdult(dob: string) {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return d <= limit && d.getFullYear() > 1930;
}

// ---------------- Server-side schema (also used by the admin edit form) ----------------
const req = (max = 200) => z.string().trim().min(1, 'Required').max(max);
const opt = (max = 200) =>
  z.preprocess((v) => (v == null ? '' : v), z.string().trim().max(max)).transform((v) => v || null);
const num = (max = 1e9) =>
  z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(0).max(max).nullable());
const date = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
);
const list = z.preprocess(
  (v) => (Array.isArray(v) ? v.join(',') : v ?? ''),
  z.string().max(1000).transform((s) =>
    Array.from(new Set(s.split(',').map((x) => x.trim()).filter(Boolean))).slice(0, 40)),
);

const base = z.object({
  full_name: req(120),
  mobile: req(25).regex(PHONE_RE, 'Invalid phone number'),
  whatsapp: opt(25),
  email: req(160).regex(EMAIL_RE, 'Invalid email').transform((s) => s.toLowerCase()),
  date_of_birth: date,
  gender: opt(30),
  nationality: opt(80),
  current_country: opt(80),
  current_city: opt(80),
  address: opt(500),
  highest_qualification: z.enum(QUALIFICATIONS as [string, ...string[]]),
  specialization: opt(),
  institution: opt(),
  year_of_passing: num(2100),
  certifications: opt(1000),
  technical_qualifications: opt(1000),
  experience_type: z.enum(['fresher', 'experienced']),
  experience_years: num(60),
  job_title: opt(),
  previous_company: opt(),
  industry: opt(),
  key_skills: list,
  languages: list,
  professional_license: opt(300),
  preferred_countries: z.array(z.string().max(120)).min(1).max(30),
  preferred_category: req(120),
  preferred_role: opt(),
  preferred_location: opt(),
  employment_type: opt(60),
  expected_salary: num(),
  salary_currency: opt(10),
  current_salary: num(),
  notice_period: opt(60),
  willing_to_relocate: opt(60),
  passport_status: z.enum(['yes', 'no', 'applied']),
  passport_expiry: date,
  introduction: opt(2000),
  abroad_motivation: opt(2000),
  additional_info: opt(2000),
});

const tidy = <T extends { experience_type: string; experience_years: number | null; passport_status: string; passport_expiry: string | null }>(d: T) => ({
  ...d,
  experience_years: d.experience_type === 'fresher' ? 0 : d.experience_years ?? 0,
  passport_expiry: d.passport_status === 'yes' ? d.passport_expiry : null,
});

export const candidateSchema = base.transform(tidy);
export const registrationSchema = base
  .extend({
    consent_accuracy: z.literal(true),
    consent_storage: z.literal(true),
    consent_communication: z.literal(true),
  })
  .refine((d) => !d.date_of_birth || isAdult(d.date_of_birth), { message: 'Candidates must be 18 or older', path: ['date_of_birth'] })
  .transform(tidy);

// Convert a database row into form values (arrays become comma-separated text).
export function toFormValues(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of ALL_FIELDS) {
    const v = row[f.name];
    if (f.name === 'key_skills' || f.name === 'languages') out[f.name] = (v || []).join(', ');
    else if (f.type === 'multi') out[f.name] = v || [];
    else out[f.name] = v ?? '';
  }
  return out;
}

export const BUCKET = 'candidate-documents';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const STATUSES = [
  { key: 'new', label: 'New Registration', tone: 'blue' },
  { key: 'under_review', label: 'Profile Under Review', tone: 'blue' },
  { key: 'suitable', label: 'Suitable Candidate', tone: 'teal' },
  { key: 'shortlisted', label: 'Shortlisted', tone: 'gold' },
  { key: 'profile_shared', label: 'Employer Profile Shared', tone: 'gold' },
  { key: 'interview_scheduled', label: 'Interview Scheduled', tone: 'violet' },
  { key: 'interview_completed', label: 'Interview Completed', tone: 'violet' },
  { key: 'selected', label: 'Selected', tone: 'green' },
  { key: 'documentation', label: 'Documentation in Progress', tone: 'green' },
  { key: 'visa_processing', label: 'Visa Processing', tone: 'green' },
  { key: 'deployed', label: 'Deployed / Successfully Placed', tone: 'emerald' },
  { key: 'rejected', label: 'Rejected', tone: 'red' },
  { key: 'on_hold', label: 'On Hold', tone: 'gray' },
] as const;

export const STATUS_KEYS = STATUSES.map((s) => s.key) as string[];
export const statusLabel = (key: string) => STATUSES.find((s) => s.key === key)?.label ?? key;

export const QUALIFICATIONS = [
  'Below Secondary',
  'Secondary (10th)',
  'Higher Secondary (12th)',
  'ITI / Trade Certificate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate / PhD',
];

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Temporary / Seasonal', 'Part-time', 'Any'];
export const CURRENCIES = ['USD', 'EUR', 'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'INR', 'Other'];
export const NOTICE_PERIODS = ['Immediately available', '15 days', '30 days', '60 days', '90 days or more'];
export const RELOCATE_OPTIONS = ['Yes', 'No', 'Depends on the opportunity'];
export const REQUIREMENT_STATUSES = [
  { key: 'draft', label: 'Draft' },
  { key: 'open', label: 'Open' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'filled', label: 'Filled' },
  { key: 'closed', label: 'Closed' },
];

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const JPG = 'image/jpeg';
const PNG = 'image/png';

export const MIME_BY_EXT: Record<string, string> = { pdf: PDF, docx: DOCX, jpg: JPG, jpeg: JPG, png: PNG };

export const DOC_TYPES = [
  { key: 'resume', label: 'Updated Resume / CV', required: true, exts: ['pdf', 'docx'], help: 'PDF or DOCX' },
  { key: 'passport', label: 'Passport Copy', required: false, exts: ['pdf', 'jpg', 'jpeg', 'png'], help: 'Optional. You can also provide this later, only when it is required.' },
  { key: 'education_certificate', label: 'Educational Certificates', required: false, exts: ['pdf', 'jpg', 'jpeg', 'png'], help: 'Optional. Combine multiple certificates into one PDF.' },
  { key: 'experience_certificate', label: 'Experience Certificates', required: false, exts: ['pdf', 'jpg', 'jpeg', 'png'], help: 'Optional. Combine multiple certificates into one PDF.' },
  { key: 'professional_license', label: 'Professional Licenses', required: false, exts: ['pdf', 'jpg', 'jpeg', 'png'], help: 'Optional' },
  { key: 'photo', label: 'Passport-size Photograph', required: false, exts: ['jpg', 'jpeg', 'png'], help: 'Optional. JPG or PNG.' },
] as const;

export const docTypeLabel = (key: string) => DOC_TYPES.find((d) => d.key === key)?.label ?? key;

export const fileExt = (name: string) => (name.split('.').pop() || '').toLowerCase();

// Returns an error message, or null when the file is acceptable for the doc type.
export function checkFile(docType: string, name: string, size: number, mime?: string): string | null {
  const def = DOC_TYPES.find((d) => d.key === docType);
  if (!def) return 'Unknown document type.';
  const ext = fileExt(name);
  if (!(def.exts as readonly string[]).includes(ext)) {
    return `${def.label}: only ${def.exts.filter((e) => e !== 'jpeg').join(', ').toUpperCase()} files are accepted.`;
  }
  if (mime && mime !== MIME_BY_EXT[ext]) return `${def.label}: the file type does not match its extension.`;
  if (size <= 0) return `${def.label}: the file is empty.`;
  if (size > MAX_FILE_BYTES) return `${def.label}: the file is larger than 5 MB.`;
  return null;
}

export const ROLES = [
  { key: 'super_admin', label: 'Super Admin', help: 'Full access, including admin users, settings and deleting records.' },
  { key: 'recruiter', label: 'Recruiter', help: 'Manage candidates, documents, requirements and master data.' },
  { key: 'viewer', label: 'Viewer', help: 'Read-only. Cannot download documents.' },
];

// Fallback lists used when the database is not reachable (e.g. before setup).
export const DEFAULT_COUNTRIES = [
  { name: 'Germany', iso_code: 'de', description: 'Register your interest in healthcare, engineering, skilled trades and logistics roles with German employers.' },
  { name: 'United Arab Emirates (UAE)', iso_code: 'ae', description: 'Register your interest in hospitality, construction, retail, facilities and professional roles across the Emirates.' },
  { name: 'Saudi Arabia', iso_code: 'sa', description: 'Register your interest in construction, oil and gas, healthcare, and operations and maintenance roles.' },
  { name: 'Qatar', iso_code: 'qa', description: 'Register your interest in construction, hospitality, facilities management and technical roles.' },
  { name: 'Kuwait', iso_code: 'kw', description: 'Register your interest in oil and gas, healthcare, driving and technical trade roles.' },
  { name: 'Oman', iso_code: 'om', description: 'Register your interest in construction, hospitality, logistics and skilled technical roles.' },
  { name: 'Bahrain', iso_code: 'bh', description: 'Register your interest in hospitality, finance, manufacturing and service-sector roles.' },
  { name: 'Other European Countries', iso_code: 'eu', description: 'Tell us which other European countries you would consider for skilled and semi-skilled work.' },
  { name: 'Other International Destinations', iso_code: null as string | null, description: 'Open to other markets? Register and tell us where you would like to work.' },
];

export const DEFAULT_CATEGORIES = [
  { name: 'Construction & Civil Engineering', icon: 'hard-hat', description: 'Civil engineers, site supervisors, masons, carpenters, steel fixers and surveyors.' },
  { name: 'Mechanical & Electrical Engineering', icon: 'cog', description: 'Mechanical and electrical engineers, technicians, HVAC and MEP specialists.' },
  { name: 'Healthcare & Nursing', icon: 'stethoscope', description: 'Registered nurses, caregivers, lab and radiology technicians, allied health staff.' },
  { name: 'Hospitality & Hotel Management', icon: 'hotel', description: 'Front office, housekeeping, guest relations and hotel operations.' },
  { name: 'Restaurant & Food Services', icon: 'utensils', description: 'Chefs, cooks, bakers, baristas, waiters and kitchen stewards.' },
  { name: 'Drivers & Transportation', icon: 'truck', description: 'Light and heavy vehicle drivers, bus drivers and equipment operators.' },
  { name: 'Warehouse & Logistics', icon: 'warehouse', description: 'Storekeepers, pickers and packers, forklift operators and supply chain staff.' },
  { name: 'Manufacturing & Production', icon: 'factory', description: 'Machine operators, production workers, quality control and line supervisors.' },
  { name: 'Oil & Gas', icon: 'fuel', description: 'Riggers, pipe fitters, welders, HSE officers and plant operators.' },
  { name: 'IT & Software', icon: 'laptop', description: 'Developers, network and system administrators, and IT support.' },
  { name: 'Sales & Marketing', icon: 'trending-up', description: 'Sales executives, retail associates, merchandisers and marketing staff.' },
  { name: 'Accounting & Finance', icon: 'calculator', description: 'Accountants, bookkeepers, auditors and finance officers.' },
  { name: 'Security Services', icon: 'shield', description: 'Security guards, supervisors and CCTV operators.' },
  { name: 'Skilled & Technical Trades', icon: 'wrench', description: 'Electricians, plumbers, welders, fabricators, painters and AC technicians.' },
  { name: 'General Helpers & Labour', icon: 'users', description: 'Helpers, cleaners, loaders and general workers.' },
  { name: 'Other Professional Categories', icon: 'briefcase', description: 'Any profession not listed above. Tell us about your field.' },
];

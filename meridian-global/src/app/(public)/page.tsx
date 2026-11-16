import Link from 'next/link';
import {
  ArrowRight, ChevronRight, FileCheck2, Globe, Handshake, Layers, Lock, Mail, MapPinned, ShieldCheck, UserCheck,
} from 'lucide-react';
import { CategoryIcon } from '@/lib/icons';
import { getCategories, getCountries, getPublishedVacancies } from '@/lib/public-data';
import { site } from '@/config/site';

export const revalidate = 120;

const STEPS = [
  { title: 'Share Your Profile', text: 'Complete the registration form with your qualifications, experience and preferred countries.' },
  { title: 'Profile Review', text: 'Our recruitment team reviews your details and adds you to our candidate database.' },
  { title: 'Get Matched', text: 'When an employer shares a requirement, we identify candidates whose profiles fit.' },
  { title: 'Interview & Documentation', text: 'Matched candidates are contacted for interviews and guided through documentation.' },
];

const REASONS = [
  { icon: Handshake, title: 'Direct Employer Relationships', text: 'We work directly with companies to understand their manpower requirements.' },
  { icon: UserCheck, title: 'Matched on Merit', text: 'Profiles are matched on qualifications, experience and skills.' },
  { icon: Lock, title: 'Your Data is Protected', text: 'Your information and documents are stored privately and used for recruitment only.' },
  { icon: ShieldCheck, title: 'Honest Communication', text: 'We contact you when an opportunity fits. We never promise placement or visas.' },
];

// Photographs live in /public: hero.jpg, about.jpg and buildings.jpg. Replace those files to change them.

function Flag({ code, name }: { code: string | null; name: string }) {
  if (!code) {
    return (
      <span className="flex h-10 w-14 items-center justify-center rounded border border-navy-100 bg-brand-50">
        <Globe className="h-5 w-5 text-brand-500" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`} alt={`Flag: ${name}`} width={56} height={40} loading="lazy"
      className="h-10 w-14 rounded border border-navy-100 object-cover" />
  );
}

export default async function HomePage() {
  const [countries, categories, vacancies] = await Promise.all([
    getCountries(), getCategories(), getPublishedVacancies(),
  ]);

  // Facts about the service only. No placement numbers or ratings are claimed.
  const facts = [
    { icon: MapPinned, value: String(countries.length), label: 'Destination Markets' },
    { icon: Layers, value: String(categories.length), label: 'Job Categories' },
    { icon: FileCheck2, value: '6 Steps', label: 'Simple Registration' },
    { icon: Lock, value: 'Private', label: 'Secure Document Storage' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-50 to-brand-100">
        <div className="pointer-events-none absolute -right-40 -top-24 hidden h-[640px] w-[640px] rounded-full bg-brand-100 lg:block" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 right-0 hidden h-72 w-72 rounded-tl-[160px] bg-brand-500 lg:block" aria-hidden />
        <div className="container-page relative grid items-center gap-10 pb-28 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:pb-32 lg:pt-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-500">Your Career. Our Priority.</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] text-navy-900 sm:text-5xl lg:text-[3.6rem]">
              Connecting Global Opportunities With <span className="text-brand-500">Skilled Talent</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-700">
              Your gateway to international career opportunities. Register with us and take the next step
              towards building your career across global markets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-navy px-7 py-3 text-base">
                Register as a Candidate <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="#destinations" className="btn border border-brand-500 bg-white px-7 py-3 text-base text-brand-500 hover:bg-brand-50">
                Explore Opportunities
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero.jpg" alt="A smiling professional holding a folder in a modern office" width={1095} height={930}
              className="aspect-[4/3.4] w-full rounded-[2.5rem] rounded-tl-[7rem] object-cover shadow-card" />
          </div>
        </div>
      </section>

      {/* Facts bar */}
      <section className="container-page relative z-10 -mt-14">
        <dl className="grid grid-cols-2 gap-y-6 rounded-2xl border border-brand-100 bg-white px-6 py-6 shadow-card lg:grid-cols-4 lg:divide-x lg:divide-brand-100">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center justify-center gap-4 px-3">
              <f.icon className="h-8 w-8 shrink-0 text-brand-500" aria-hidden />
              <div>
                <dd className="text-xl font-bold leading-tight text-navy-900">{f.value}</dd>
                <dt className="text-sm text-navy-600">{f.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-28 py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/about.jpg" alt="A recruitment consultant talking with a candidate" width={1155} height={627} loading="lazy"
            className="aspect-[16/10] w-full rounded-2xl object-cover shadow-card" />
          <div>
            <p className="text-lg font-bold text-brand-500">About {site.name}</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
              Your Manpower Consultancy for Careers Abroad
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-navy-700">
              We work directly with companies and employers in Germany, the Gulf and other international
              markets to understand their manpower requirements, and we connect them with suitable candidates
              from our recruitment database. Register once, and our team will consider your profile whenever
              a matching requirement arrives.
            </p>
            <Link href="/register" className="btn-navy mt-7 px-7 py-3 text-base">
              Register Now <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="scroll-mt-28 bg-brand-50 py-20">
        <div className="container-page">
          <p className="eyebrow">Explore Opportunities</p>
          <h2 className="mt-2 text-3xl font-bold text-navy-900 sm:text-4xl">Destination Countries</h2>
          <p className="mt-4 max-w-2xl text-lg text-navy-700">
            Tell us which countries interest you. When an employer in that market shares a requirement
            that fits your profile, our team will get in touch.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <article key={c.name} className="card flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-brand-300">
                <div className="flex items-center gap-4">
                  <Flag code={c.iso_code} name={c.name} />
                  <h3 className="text-xl font-bold leading-snug text-navy-900">{c.name}</h3>
                </div>
                <p className="mt-4 flex-1 leading-relaxed text-navy-600">{c.description}</p>
                <Link href={`/register?country=${encodeURIComponent(c.name)}#form`} className="btn-navy mt-5 self-start"
                  aria-label={`Apply now for ${c.name}`}>
                  Apply Now <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Verified vacancies: rendered only when an admin has published some */}
      {vacancies.length > 0 && (
        <section id="vacancies" className="scroll-mt-28 py-20">
          <div className="container-page">
            <p className="eyebrow">Verified Requirements</p>
            <h2 className="mt-2 text-3xl font-bold text-navy-900 sm:text-4xl">Current Employer Requirements</h2>
            <p className="mt-4 max-w-2xl text-lg text-navy-700">
              These requirements have been verified and published by our recruitment team.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {vacancies.map((v) => (
                <article key={v.id} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-xl font-bold text-navy-900">{v.job_position}</h3>
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">{v.destination_country}</span>
                  </div>
                  <p className="mt-1 text-sm text-navy-500">{v.job_category} · Ref {v.requirement_code}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div><dt className="text-navy-400">Positions</dt><dd className="font-semibold">{v.workers_required}</dd></div>
                    <div><dt className="text-navy-400">Experience</dt><dd className="font-semibold">{Number(v.min_experience_years) > 0 ? `${v.min_experience_years}+ years` : 'Freshers considered'}</dd></div>
                    {v.min_qualification && <div><dt className="text-navy-400">Qualification</dt><dd className="font-semibold">{v.min_qualification}</dd></div>}
                    {v.salary_range && <div><dt className="text-navy-400">Salary range</dt><dd className="font-semibold">{v.salary_range}</dd></div>}
                    {v.application_deadline && <div><dt className="text-navy-400">Apply by</dt><dd className="font-semibold">{new Date(v.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>}
                  </dl>
                  <Link href={`/register?country=${encodeURIComponent(v.destination_country)}&category=${encodeURIComponent(v.job_category)}&role=${encodeURIComponent(v.job_position)}#form`} className="btn-navy mt-5">Apply Now</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section id="categories" className="scroll-mt-28 py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Explore Opportunities</p>
              <h2 className="mt-2 text-3xl font-bold text-navy-900 sm:text-4xl">Top Job Categories</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-1.5 font-bold text-brand-500 hover:text-brand-700">
              Register for Any Category <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.name} href={`/register?category=${encodeURIComponent(c.name)}#form`}
                className="group flex flex-col items-center rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-6 text-center transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-white hover:shadow-card">
                <CategoryIcon name={c.icon} className="h-9 w-9 text-brand-500" />
                <h3 className="mt-3 text-base font-bold leading-snug text-navy-900">{c.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-navy-600">{c.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-bold text-white group-hover:bg-brand-600">
                  Apply Now <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-brand-50 py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[.8fr_1.15fr_.6fr]">
          <div>
            <p className="eyebrow">Why Choose Us</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
              Your Success <br className="hidden sm:block" />is Our Success
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-700">
              We match people to real employer requirements and stay honest about every step of the process.
            </p>
            <Link href="/register" className="btn-navy mt-7 px-7 py-3 text-base">
              Register as a Candidate <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.title} className="rounded-xl border border-brand-100 bg-white p-6 text-center">
                <r.icon className="mx-auto h-9 w-9 text-brand-500" aria-hidden />
                <h3 className="mt-3 text-lg font-bold text-navy-900">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{r.text}</p>
              </div>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/buildings.jpg" alt="Modern office towers seen from below" width={702} height={510} loading="lazy"
            className="hidden h-[420px] w-full rounded-2xl rounded-tl-[5rem] object-cover lg:block" />
        </div>
      </section>

      {/* Process */}
      <section id="how-it-works" className="scroll-mt-28 py-20">
        <div className="container-page">
          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-8 lg:p-12">
            <p className="eyebrow">Our Process</p>
            <h2 className="mt-2 text-3xl font-bold text-navy-900 sm:text-4xl">Simple Steps to Your Career Abroad</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative text-center">
                  {i < STEPS.length - 1 && <ChevronRight className="absolute -right-6 top-2.5 hidden h-6 w-6 text-brand-400 lg:block" aria-hidden />}
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-500 px-8 py-9 text-white md:flex-row md:items-center lg:px-12">
            <div className="flex items-center gap-5">
              <Mail className="hidden h-12 w-12 shrink-0 sm:block" aria-hidden />
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Ready to take the next step?</h2>
                <p className="mt-1.5 text-brand-100">Registration takes about ten minutes. Keep your resume ready in PDF or DOCX format.</p>
              </div>
            </div>
            <Link href="/register" className="btn shrink-0 bg-white px-7 py-3 text-base text-brand-500 hover:bg-brand-50">
              Register Now <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

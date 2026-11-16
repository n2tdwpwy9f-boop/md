import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { site } from '@/config/site';

export const metadata: Metadata = { title: 'Registration Successful', robots: { index: false } };

export default function SuccessPage({ searchParams }: { searchParams: { id?: string; docs?: string } }) {
  const id = /^CND-\d{2}-\d{4,10}$/.test(searchParams.id || '') ? searchParams.id : null;

  return (
    <div className="bg-navy-50/60 py-16 sm:py-24">
      <div className="container-page max-w-2xl">
        <div className="card overflow-hidden text-center">
          <div className="h-1.5 bg-gradient-to-r from-brand-600 via-brand-300 to-brand-600" aria-hidden />
          <div className="p-8 sm:p-12">
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-500" aria-hidden />
            <h1 className="mt-5 text-3xl font-semibold text-navy-900">Thank you for registering with us!</h1>

            {id && (
              <div className="mx-auto mt-8 max-w-sm rounded-xl bg-brand-500 px-6 py-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Candidate Registration ID</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-wide">{id}</p>
                <p className="mt-2 text-xs text-navy-200">Please save this ID for future reference.</p>
              </div>
            )}

            <p className="mt-8 leading-relaxed text-navy-600">
              Your profile has been successfully submitted to our recruitment database. Our recruitment team
              will review your information and contact you if a suitable employment opportunity matches your
              qualifications and experience.
            </p>
            <p className="mt-4 font-semibold text-navy-800">We wish you success in your international career journey!</p>

            {searchParams.docs === 'incomplete' && (
              <p role="alert" className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
                Your registration was saved, but one or more documents could not be uploaded. Please email them to{' '}
                <a className="font-semibold underline" href={`mailto:${site.email}`}>{site.email}</a>
                {id ? ` and quote your Candidate ID ${id}.` : '.'}
              </p>
            )}

            <p className="mt-6 text-xs text-navy-400">
              Registration does not guarantee placement, visa approval or employment.
            </p>
            <Link href="/" className="btn-navy mt-8">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

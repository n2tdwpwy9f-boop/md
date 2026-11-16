import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { site } from '@/config/site';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        <circle cx="17" cy="17" r="16" fill={light ? '#ffffff' : '#0530AD'} />
        <ellipse cx="17" cy="17" rx="7" ry="16" fill="none" stroke={light ? '#0530AD' : '#ffffff'} strokeWidth="1.4" />
        <path d="M1 17h32M4 9h26M4 25h26" stroke={light ? '#0530AD' : '#ffffff'} strokeWidth="1.4" fill="none" />
      </svg>
      <span className="leading-tight">
        <span className={`block font-display text-lg font-semibold ${light ? 'text-white' : 'text-navy-900'}`}>{site.name}</span>
        <span className={`hidden text-[10px] font-semibold uppercase tracking-[0.16em] sm:block ${light ? 'text-navy-200' : 'text-navy-400'}`}>
          International Manpower
        </span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#destinations', label: 'Destinations' },
  { href: '/#categories', label: 'Job Categories' },
  { href: '/#how-it-works', label: 'Our Process' },
  { href: '/#contact', label: 'Contact' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-semibold text-navy-700 hover:text-brand-500">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/register" className="btn-gold whitespace-nowrap">
          Register <span className="hidden sm:inline">as a Candidate</span>
        </Link>
      </div>
      <nav className="flex gap-5 overflow-x-auto border-t border-navy-50 px-5 py-2 md:hidden" aria-label="Sections">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-xs font-semibold text-navy-600">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="bg-brand-500 text-navy-200">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">
            {site.legalName}. We work with employers in Germany, the Gulf and other international markets
            and connect them with suitable candidates from our recruitment database.
          </p>
          {site.licenseNote && <p className="mt-3 text-xs text-navy-300">{site.licenseNote}</p>}
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" aria-hidden />{site.phone}</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" aria-hidden />
              <a href={`mailto:${site.email}`} className="hover:text-white">{site.email}</a></li>
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" aria-hidden />{site.address}</li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Candidates</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="/register" className="hover:text-white">Register as a Candidate</Link></li>
            <li><Link href="/#destinations" className="hover:text-white">Destination Countries</Link></li>
            <li><Link href="/#categories" className="hover:text-white">Job Categories</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy &amp; Data Retention</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-navy-300 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</p>
          <p>Registration does not guarantee placement, a visa or employment.</p>
        </div>
      </div>
    </footer>
  );
}

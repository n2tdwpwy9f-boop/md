'use client';

import { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { STATUSES, statusLabel } from '@/lib/constants';

const TONES: Record<string, string> = {
  blue: 'bg-sky-50 text-sky-800 ring-sky-200',
  teal: 'bg-teal-50 text-teal-800 ring-teal-200',
  gold: 'bg-brand-50 text-brand-700 ring-brand-200',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200',
  green: 'bg-green-50 text-green-800 ring-green-200',
  emerald: 'bg-emerald-600 text-white ring-emerald-600',
  red: 'bg-red-50 text-red-700 ring-red-200',
  gray: 'bg-navy-50 text-navy-600 ring-navy-200',
};

export function Badge({ tone = 'gray', children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${TONES[tone] || TONES.gray}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUSES.find((s) => s.key === status)?.tone || 'gray';
  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-navy-400" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 sm:p-8" role="dialog" aria-modal aria-label={title}>
      <div className={`w-full rounded-xl bg-white shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <h2 className="font-sans text-lg font-bold text-navy-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-800">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{children}</p>;
}

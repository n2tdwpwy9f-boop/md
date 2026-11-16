'use client';

import { useEffect, useState } from 'react';
import type { Field, Option } from '@/lib/candidate-fields';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Day / Month / Year dropdowns. Easier than a calendar when the year is far from today.
function DateSelect({ id, value, years, invalid, describedBy, onChange }: {
  id: string; value: string; years: 'birth' | 'future'; invalid: boolean; describedBy?: string; onChange: (iso: string) => void;
}) {
  const parse = (v: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return m ? { y: m[1], m: String(Number(m[2])), d: String(Number(m[3])) } : { y: '', m: '', d: '' };
  };
  const [p, setP] = useState(() => parse(value));
  // Follow outside changes (restored draft, admin edit form).
  useEffect(() => { if (value) setP(parse(value)); }, [value]);

  const now = new Date().getFullYear();
  const yearList = years === 'future'
    ? Array.from({ length: 21 }, (_, i) => now - 5 + i)
    : Array.from({ length: 63 }, (_, i) => now - 18 - i);
  const maxDay = p.m ? new Date(Number(p.y) || 2000, Number(p.m), 0).getDate() : 31;

  const set = (part: 'd' | 'm' | 'y', v: string) => {
    const next = { ...p, [part]: v };
    const limit = next.m ? new Date(Number(next.y) || 2000, Number(next.m), 0).getDate() : 31;
    if (Number(next.d) > limit) next.d = '';
    setP(next);
    onChange(next.y && next.m && next.d ? `${next.y}-${next.m.padStart(2, '0')}-${next.d.padStart(2, '0')}` : '');
  };
  const cls = `input ${invalid ? 'input-error' : ''}`;

  return (
    <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2" role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
      <select className={cls} aria-label="Day" value={p.d} onChange={(e) => set('d', e.target.value)}>
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      <select className={cls} aria-label="Month" value={p.m} onChange={(e) => set('m', e.target.value)}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select className={cls} aria-label="Year" value={p.y} onChange={(e) => set('y', e.target.value)}>
        <option value="">Year</option>
        {p.y && !yearList.includes(Number(p.y)) && <option value={p.y}>{p.y}</option>}
        {yearList.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

type Props = {
  field: Field;
  value: any;
  error?: string;
  lists: { countries: string[]; categories: string[] };
  onChange: (name: string, value: any) => void;
};

// Renders one form field from its definition. Shared by the public registration
// form and the admin edit form.
export default function FieldInput({ field: f, value, error, lists, onChange }: Props) {
  const id = `f-${f.name}`;
  const options: Option[] = f.optionsKey
    ? lists[f.optionsKey].map((v) => ({ value: v, label: v }))
    : f.options || [];
  const describedBy = error ? `${id}-err` : f.help ? `${id}-help` : undefined;
  const cls = `input ${error ? 'input-error' : ''}`;
  const common = { id, name: f.name, 'aria-invalid': !!error, 'aria-describedby': describedBy };
  const grouped = f.type === 'radio' || f.type === 'multi' || f.type === 'date';

  let control: React.ReactNode;
  if (f.type === 'textarea') {
    control = <textarea {...common} rows={3} className={cls} placeholder={f.placeholder} value={value ?? ''}
      onChange={(e) => onChange(f.name, e.target.value)} />;
  } else if (f.type === 'date') {
    control = <DateSelect id={id} value={value ?? ''} years={f.years || 'birth'} invalid={!!error} describedBy={describedBy}
      onChange={(iso) => onChange(f.name, iso)} />;
  } else if (f.type === 'select') {
    control = (
      <select {...common} className={cls} value={value ?? ''} onChange={(e) => onChange(f.name, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else if (f.type === 'radio') {
    control = (
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-labelledby={`${id}-label`}>
        {options.map((o) => (
          <label key={o.value}
            className={`cursor-pointer rounded-md border px-4 py-2.5 text-sm font-semibold transition ${value === o.value ? 'border-brand-500 bg-brand-500 text-white' : 'border-navy-200 bg-white text-navy-700 hover:border-navy-400'}`}>
            <input type="radio" className="sr-only" name={f.name} value={o.value} checked={value === o.value}
              onChange={() => onChange(f.name, o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    );
  } else if (f.type === 'multi') {
    const selected: string[] = Array.isArray(value) ? value : [];
    const toggle = (v: string) =>
      onChange(f.name, selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
    control = (
      <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby={`${id}-label`}>
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <label key={o.value}
              className={`cursor-pointer rounded-md border px-3.5 py-2 text-sm font-semibold transition ${on ? 'border-brand-500 bg-brand-50 text-navy-900 ring-1 ring-brand-400' : 'border-navy-200 bg-white text-navy-700 hover:border-navy-400'}`}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(o.value)} />
              {on ? '✓ ' : ''}{o.label}
            </label>
          );
        })}
      </div>
    );
  } else {
    control = (
      <input {...common} className={cls} placeholder={f.placeholder} value={value ?? ''}
        type={f.type} inputMode={f.type === 'number' ? 'decimal' : undefined}
        min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? 'any' : undefined}
        autoComplete={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined}
        onChange={(e) => onChange(f.name, e.target.value)} />
    );
  }

  const labelText = (
    <>
      {f.label}
      {f.required && <span className="text-red-600" aria-hidden> *</span>}
    </>
  );

  return (
    <div className={f.full ? 'sm:col-span-2' : ''}>
      {grouped
        ? <span id={`${id}-label`} className="label">{labelText}</span>
        : <label htmlFor={id} className="label">{labelText}</label>}
      {control}
      {error
        ? <p id={`${id}-err`} className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>
        : f.help && <p id={`${id}-help`} className="mt-1.5 text-xs text-navy-400">{f.help}</p>}
    </div>
  );
}

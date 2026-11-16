'use client';

import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError('Incorrect email or password.');
      setBusy(false);
      return;
    }
    window.location.href = '/admin';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-brand-300">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-navy-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-navy-500">Recruitment dashboard. Authorised staff only.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-navy mt-6 w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Sign in
        </button>
      </form>
    </div>
  );
}

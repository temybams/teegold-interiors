'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Monogram } from '@/components/wordmark';
import { isApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const ResetPasswordPage = () => {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { completeReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError('The two passwords do not match');
      return;
    }

    setSaving(true);

    try {
      await completeReset(token, password);
      router.replace('/dashboard');
    } catch (caught) {
      setError(
        isApiRequestError(caught)
          ? (caught.issues[0]?.message ?? caught.message)
          : 'Could not reach the server. Try again in a moment.',
      );
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm">
        <Monogram className="size-11 text-brand" />
        <p className="mt-4 font-serif text-lg tracking-[0.2em] uppercase">Teegold Interiors</p>
        <h1 className="mt-10 font-serif text-3xl">Choose a new password</h1>

        <label className="mt-8 block">
          <span className="text-sm">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>
        </label>

        <label className="mt-4 block">
          <span className="text-sm">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        {error && (
          <p className="rounded-card mt-4 border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-sm text-cancelled">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-card mt-6 w-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save and sign in'}
        </button>

        <p className="mt-8 text-center text-xs">
          <Link href="/login" className="text-muted underline underline-offset-4 hover:text-ink">
            ← Back to sign in
          </Link>
        </p>
      </form>
    </main>
  );
};

export default ResetPasswordPage;

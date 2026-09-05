'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import { Wordmark } from '@/components/wordmark';
import { apiPost, isApiRequestError } from '@/lib/api';

const responseSchema = z.object({
  message: z.string(),
  emailed: z.boolean(),
  resetUrl: z.string().optional(),
});

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<z.infer<typeof responseSchema> | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const body = responseSchema.parse(
        await apiPost<unknown>('/api/auth/password-reset', { email }),
      );
      setResult(body);
    } catch (caught) {
      setError(
        isApiRequestError(caught)
          ? caught.message
          : 'Could not reach the server. Try again in a moment.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-sm">
        <Wordmark />
        <h1 className="mt-10 font-serif text-3xl">Reset password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter the email on your account. If it exists, we will send a reset link.
        </p>

        {result ? (
          <div className="mt-8 text-sm">
            <p>{result.message}</p>
            {!result.emailed && result.resetUrl && (
              <p className="mt-3 text-muted">
                Email is not configured on this server. Use this link now:{' '}
                <Link href={result.resetUrl} className="text-brand underline underline-offset-4">
                  Reset password
                </Link>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8">
            <label className="block">
              <span className="text-sm">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>
            {error && <p className="mt-3 text-sm text-cancelled">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-card mt-6 w-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs">
          <Link href="/login" className="text-muted underline underline-offset-4 hover:text-ink">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;

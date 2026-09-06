'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Wordmark } from '@/components/wordmark';
import { isApiRequestError, type ApiIssue } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const issueFor = (issues: ApiIssue[], field: string): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

const LoginPage = () => {
  const router = useRouter();
  const { status, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setIssues([]);
    setError(null);

    try {
      await signIn(email, password);
      router.replace('/dashboard');
    } catch (caught) {
      if (isApiRequestError(caught)) {
        setIssues(caught.issues);
        setError(caught.issues.length > 0 ? null : caught.message);
      } else {
        setError('Could not reach the server. Is it running?');
      }

      setPending(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Wordmark />

          <h1 className="mt-10 font-serif text-3xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Manage orders, invoices and clients</p>

          <label className="mt-8 block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'email') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'email') && (
              <span className="mt-1 block text-xs text-cancelled">
                {issueFor(issues, 'email')}
              </span>
            )}
          </label>

          <label className="mt-4 block">
            <span className="text-sm">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'password') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'password') && (
              <span className="mt-1 block text-xs text-cancelled">
                {issueFor(issues, 'password')}
              </span>
            )}
          </label>

          {error && (
            <p className="rounded-card mt-4 border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-sm text-cancelled">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-card mt-6 w-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-4 text-center text-xs">
            <Link href="/forgot-password" className="text-muted underline underline-offset-4 hover:text-ink">
              Forgotten your password?
            </Link>
          </p>

          <p className="mt-8 text-center text-xs">
            <Link href="/" className="text-muted underline underline-offset-4 hover:text-ink">
              ← Back to teegoldinteriors.ng
            </Link>
          </p>
        </form>
      </div>

      {/* Replace with a project photograph once there is one to use. */}
      <div className="hidden flex-col justify-end bg-brand-deep p-12 lg:flex">
        <p className="max-w-sm font-serif text-2xl leading-snug text-white">
          Windows dressed with intention.
        </p>
        <p className="mt-3 text-sm text-white/60">
          Blinds, curtains and window treatments — GRA, Ado-Ekiti
        </p>
      </div>
    </main>
  );
};

export default LoginPage;

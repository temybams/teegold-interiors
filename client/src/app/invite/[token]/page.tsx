'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InlineLoader } from '@/components/loader';
import { Wordmark } from '@/components/wordmark';
import { apiFetch, isApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { inviteDetailsResponseSchema } from '@/lib/schemas';

type Invite = { name: string; email: string };

type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ready'; invite: Invite };

const InvitePage = () => {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { acceptInvite } = useAuth();

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { invite } = inviteDetailsResponseSchema.parse(
          await apiFetch<unknown>(`/api/auth/invites/${token}`),
        );

        if (!cancelled) {
          setState({ kind: 'ready', invite });
        }
      } catch (caught) {
        if (!cancelled) {
          setState({
            kind: 'invalid',
            message: isApiRequestError(caught)
              ? caught.message
              : 'Could not reach the server. Try again in a moment.',
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError('The two passwords do not match');
      return;
    }

    setSaving(true);

    try {
      await acceptInvite(token, password);
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
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-sm">
        <Wordmark />

        {state.kind === 'loading' && <InlineLoader label="Checking your invite" />}

        {state.kind === 'invalid' && (
          <>
            <h1 className="mt-10 font-serif text-3xl">Invite not valid</h1>
            <p className="mt-3 text-sm text-muted">{state.message}</p>
          </>
        )}

        {state.kind === 'ready' && (
          <form onSubmit={submit}>
            <h1 className="mt-10 font-serif text-3xl">Welcome, {state.invite.name.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-muted">
              Choose a password for {state.invite.email} to finish setting up your account.
            </p>

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
              {saving ? 'Setting up…' : 'Set password and sign in'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default InvitePage;

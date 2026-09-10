'use client';

import { useEffect, useState } from 'react';

import { apiBaseUrl, apiFetch } from '@/lib/api';
import { healthSchema, type Health } from '@/lib/schemas';

type State =
  { kind: 'loading' } | { kind: 'ok'; health: Health } | { kind: 'error'; message: string };

export const ApiStatus = () => {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const health = healthSchema.parse(await apiFetch<unknown>('/api/health'));

        if (!cancelled) {
          setState({ kind: 'ok', health });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: error instanceof Error ? error.message : 'Unable to reach the server',
          });
        }
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-card border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.12em] text-muted uppercase">Server connection</p>
          <p className="mt-1 break-all font-mono text-xs text-ink sm:text-sm">
            {apiBaseUrl ? `${apiBaseUrl}/api/health` : '/api/health'}
          </p>
        </div>

        {state.kind === 'loading' && (
          <span className="rounded-card border border-hairline px-2.5 py-1 text-xs text-muted">
            Checking…
          </span>
        )}
        {state.kind === 'ok' && (
          <span className="rounded-card border border-paid/30 bg-paid/10 px-2.5 py-1 text-xs font-medium text-paid">
            Connected
          </span>
        )}
        {state.kind === 'error' && (
          <span className="rounded-card border border-cancelled/30 bg-cancelled/10 px-2.5 py-1 text-xs font-medium text-cancelled">
            Offline
          </span>
        )}
      </div>

      {state.kind === 'ok' && (
        <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Service</dt>
            <dd className="mt-1 text-sm">{state.health.service}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Version</dt>
            <dd className="tabular mt-1 text-sm">{state.health.version}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Uptime</dt>
            <dd className="tabular mt-1 text-sm">{state.health.uptimeSeconds}s</dd>
          </div>
        </dl>
      )}

      {state.kind === 'error' && (
        <p className="mt-4 border-t border-hairline pt-4 text-sm text-muted">
          {state.message}. Start it with <code className="text-ink">yarn dev</code> inside{' '}
          <code className="text-ink">server/</code>.
        </p>
      )}
    </div>
  );
};

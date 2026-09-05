'use client';

import { healthResponseSchema, type HealthResponse } from '@teegold/shared';
import { useEffect, useState } from 'react';

import { apiBaseUrl, apiFetch } from '@/lib/api';

type State =
  { kind: 'loading' } | { kind: 'ok'; health: HealthResponse } | { kind: 'error'; message: string };

export const ApiStatus = () => {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const body = await apiFetch<unknown>('/health');
        const health = healthResponseSchema.parse(body);

        if (!cancelled) {
          setState({ kind: 'ok', health });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: error instanceof Error ? error.message : 'Unable to reach the API',
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
          <p className="text-xs tracking-[0.12em] text-muted uppercase">API connection</p>
          <p className="mt-1 font-mono text-sm text-ink">{apiBaseUrl}/health</p>
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
            <dd className="mt-1 text-sm text-ink">{state.health.service}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Version</dt>
            <dd className="tabular mt-1 text-sm text-ink">{state.health.version}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Uptime</dt>
            <dd className="tabular mt-1 text-sm text-ink">{state.health.uptimeSeconds}s</dd>
          </div>
        </dl>
      )}

      {state.kind === 'error' && (
        <p className="mt-4 border-t border-hairline pt-4 text-sm text-muted">
          {state.message}. Start it with <code className="text-ink">yarn dev:api</code>.
        </p>
      )}
    </div>
  );
};

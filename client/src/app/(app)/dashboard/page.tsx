'use client';

import Link from 'next/link';

import { ApiStatus } from '@/components/api-status';
import { MeasurementPreview } from '@/components/measurement-preview';
import { useAuth } from '@/lib/auth-context';

const today = () =>
  new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-serif text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted">{today()}</p>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface p-4 sm:p-6">
        <p className="text-xs tracking-[0.12em] text-muted uppercase">Signed in as</p>
        <p className="mt-2 font-serif text-2xl">{user?.name}</p>
        <p className="mt-1 text-sm text-muted">
          {user?.email} · {user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
        </p>
        <p className="mt-4 border-t border-hairline pt-4 text-sm text-muted">
          Real metrics arrive in Stage 7. Raise an invoice from here in the meantime.
        </p>
        <Link
          href="/invoices/new"
          className="rounded-card mt-4 inline-block bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          New invoice
        </Link>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <ApiStatus />
        <MeasurementPreview />
      </section>
    </main>
  );
};

export default DashboardPage;

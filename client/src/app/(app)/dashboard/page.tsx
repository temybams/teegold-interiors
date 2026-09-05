'use client';

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
    <main className="px-8 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-muted">{today()}</p>
        </div>
        <span className="rounded-card bg-lilac px-2.5 py-1 text-xs font-medium tracking-[0.12em] text-brand uppercase">
          Stage 2 · Auth
        </span>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface p-6">
        <p className="text-xs tracking-[0.12em] text-muted uppercase">Signed in as</p>
        <p className="mt-2 font-serif text-2xl">{user?.name}</p>
        <p className="mt-1 text-sm text-muted">
          {user?.email} · {user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
        </p>
        <p className="mt-4 border-t border-hairline pt-4 text-sm text-muted">
          Real metrics arrive in Stage 7. Until then this page proves the session works: the
          sidebar hides admin-only sections from staff, and a signed-out visitor never gets here.
        </p>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <ApiStatus />
        <MeasurementPreview />
      </section>
    </main>
  );
};

export default DashboardPage;

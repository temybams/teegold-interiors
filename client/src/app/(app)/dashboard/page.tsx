'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { InvoiceStatus } from '@/components/invoice-status';
import { InlineLoader } from '@/components/loader';
import { apiFetch, isApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatInvoiceDate } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import { dashboardResponseSchema, type DashboardSummary } from '@/lib/schemas';

const today = () =>
  new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
    <p className="text-xs tracking-[0.12em] text-muted uppercase">{label}</p>
    <p className="tabular mt-2 font-serif text-3xl">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = dashboardResponseSchema.parse(await apiFetch<unknown>('/api/dashboard'));
      setSummary(data);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-muted">{today()}</p>
          <p className="mt-1 text-sm text-muted">
            {user?.name} · {user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/invoices/new"
            className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            New invoice
          </Link>
          <Link
            href="/clients"
            className="rounded-card border border-hairline px-4 py-2.5 text-sm"
          >
            Clients
          </Link>
          <Link
            href="/reports"
            className="rounded-card border border-hairline px-4 py-2.5 text-sm"
          >
            Reports
          </Link>
        </div>
      </header>

      {loading && <InlineLoader label="Loading overview" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {summary && (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Today's sales" value={formatNaira(summary.todaySales)} hint="Invoices raised today" />
            <Stat label="This month" value={formatNaira(summary.monthSales)} hint="Invoices raised this month" />
            <Stat label="Invoices" value={String(summary.invoiceCount)} hint="Active, not cancelled" />
            <Stat
              label="Pending payment"
              value={String(summary.pendingCount)}
              hint={`Collected today ${formatNaira(summary.todayCollected)}`}
            />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-card border border-hairline bg-surface">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:px-6">
                <h2 className="text-xs tracking-widest text-muted uppercase">Recent invoices</h2>
                <Link href="/invoices" className="text-xs text-brand underline underline-offset-4">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-hairline">
                {summary.recentInvoices.length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted sm:px-6">No invoices yet.</li>
                )}
                {summary.recentInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-lilac/40 sm:px-6"
                    >
                      <div>
                        <p className="text-sm font-medium">{invoice.number}</p>
                        <p className="text-xs text-muted">
                          {invoice.customer.name} · {formatInvoiceDate(invoice.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-sm">{formatNaira(invoice.total)}</p>
                        <div className="mt-1 flex justify-end">
                          <InvoiceStatus
                            invoice={{
                              paymentStatus: invoice.paymentStatus,
                              cancelledAt: null,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-card border border-hairline bg-surface">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:px-6">
                <h2 className="text-xs tracking-widest text-muted uppercase">Recent clients</h2>
                <Link href="/clients" className="text-xs text-brand underline underline-offset-4">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-hairline">
                {summary.recentCustomers.length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted sm:px-6">No clients yet.</li>
                )}
                {summary.recentCustomers.map((customer) => (
                  <li key={customer.id} className="px-4 py-3 sm:px-6">
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted">
                      {customer.phone} · {formatInvoiceDate(customer.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default DashboardPage;

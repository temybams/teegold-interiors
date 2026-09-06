'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { InvoiceStatus } from '@/components/invoice-status';
import { InlineLoader } from '@/components/loader';
import { apiFetch, isApiRequestError } from '@/lib/api';
import { formatInvoiceDate } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import { reportResponseSchema, type ReportSummary } from '@/lib/schemas';

const toInputDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthBounds = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toInputDate(from), to: toInputDate(now) };
};

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const ReportsPage = () => {
  const defaults = useMemo(() => monthBounds(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (range: { from: string; to: string }) => {
    setLoading(true);
    try {
      const data = reportResponseSchema.parse(
        await apiFetch<unknown>(`/api/dashboard/reports?from=${range.from}&to=${range.to}`),
      );
      setReport(data);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(defaults);
  }, [defaults, load]);

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted">Sales raised in a date range, with outstanding balances.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-card border border-hairline px-4 py-2.5 text-sm print:hidden"
        >
          Print
        </button>
      </header>

      <form
        className="mt-6 flex flex-wrap items-end gap-3 print:hidden"
        onSubmit={(event) => {
          event.preventDefault();
          void load({ from, to });
        }}
      >
        <label className="block">
          <span className="text-sm">From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-card mt-1 block border border-hairline px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm">To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-card mt-1 block border border-hairline px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Run report
        </button>
      </form>

      {loading && <InlineLoader label="Loading report" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {report && !loading && (
        <div className="mt-8 space-y-8">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Sales raised', formatNaira(report.sales)],
              ['Collected', formatNaira(report.collected)],
              ['Outstanding', formatNaira(report.outstanding)],
              ['Invoices', String(report.invoiceCount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card border border-hairline bg-surface p-4">
                <p className="text-xs tracking-[0.12em] text-muted uppercase">{label}</p>
                <p className="tabular mt-2 font-serif text-3xl">{value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ['Unpaid', report.unpaid],
                ['Partial', report.partial],
                ['Paid', report.paid],
              ] as const
            ).map(([label, bucket]) => (
              <div key={label} className="rounded-card border border-hairline bg-surface p-4">
                <p className="text-xs tracking-[0.12em] text-muted uppercase">{label}</p>
                <p className="mt-2 text-sm">
                  {bucket.count} invoice{bucket.count === 1 ? '' : 's'} · {formatNaira(bucket.total)}
                </p>
              </div>
            ))}
          </section>

          {report.topProducts.length > 0 && (
            <section className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
              <h2 className="text-xs tracking-widest text-muted uppercase">Top products</h2>
              <ul className="mt-4 divide-y divide-hairline">
                {report.topProducts.map((item) => (
                  <li key={item.name} className="flex justify-between gap-3 py-2 text-sm">
                    <span>{item.name}</span>
                    <span className="tabular text-muted">{formatNaira(item.total)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-card overflow-x-auto border border-hairline bg-surface">
            <div className="border-b border-hairline px-4 py-3 sm:px-6">
              <h2 className="text-xs tracking-widest text-muted uppercase">Invoices in range</h2>
            </div>
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-hairline text-left text-xs tracking-widest text-muted uppercase">
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-3 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Paid</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-hairline">
                    <td className="px-6 py-3">
                      <Link href={`/invoices/${invoice.id}`} className="text-brand underline underline-offset-4">
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{invoice.customerName}</td>
                    <td className="px-3 py-3 text-muted">{formatInvoiceDate(invoice.createdAt)}</td>
                    <td className="tabular px-3 py-3">{formatNaira(invoice.total)}</td>
                    <td className="tabular px-3 py-3">{formatNaira(invoice.amountPaid)}</td>
                    <td className="px-6 py-3">
                      <InvoiceStatus
                        invoice={{
                          paymentStatus: invoice.paymentStatus,
                          cancelledAt: null,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-hairline sm:hidden">
              {report.invoices.map((invoice) => (
                <li key={invoice.id} className="px-4 py-3">
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-brand">
                    {invoice.number}
                  </Link>
                  <p className="mt-1 text-sm">{invoice.customerName}</p>
                  <p className="tabular mt-1 text-sm text-muted">
                    {formatNaira(invoice.total)} · paid {formatNaira(invoice.amountPaid)}
                  </p>
                </li>
              ))}
            </ul>

            {report.invoices.length === 0 && (
              <p className="px-6 py-8 text-sm text-muted">No invoices in this range.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default ReportsPage;

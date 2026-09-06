'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { InvoiceStatus } from '@/components/invoice-status';
import { TableSkeleton } from '@/components/loader';
import { SearchField } from '@/components/search-field';
import { apiFetch, isApiRequestError } from '@/lib/api';
import { formatInvoiceDate } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import {
  invoicesResponseSchema,
  type InvoiceSummary,
} from '@/lib/schemas';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [counts, setCounts] = useState({ all: 0, paid: 0, pending: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async (search: string, status: FilterId, nextPage: number) => {
    try {
      const params = new URLSearchParams({
        status,
        page: String(nextPage),
        limit: '10',
      });

      if (search.trim()) {
        params.set('q', search.trim());
      }

      const result = invoicesResponseSchema.parse(
        await apiFetch<unknown>(`/api/invoices?${params.toString()}`),
      );
      setInvoices(result.invoices);
      setCounts(result.counts);
      setPage(result.page);
      setTotal(result.total);
      setLimit(result.limit);
      setListError(null);
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(
      () => {
        setLoading(true);
        void load(query, filter, 1);
      },
      query ? 250 : 0,
    );

    return () => window.clearTimeout(handle);
  }, [query, filter, load]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const countFor = (id: FilterId): number => counts[id];

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted">
            Numbers are assigned on save. Paid invoices lock to an admin.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          New invoice
        </Link>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-4 sm:px-6">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by number or client"
            className="w-full max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-card px-3 py-1.5 text-xs ${
                  filter === item.id ? 'bg-lilac text-brand' : 'border border-hairline text-muted'
                }`}
              >
                {item.label}
                <span className="tabular ml-1.5">{countFor(item.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {listError && <p className="px-4 py-4 text-sm text-cancelled sm:px-6">{listError}</p>}
        {loading && <TableSkeleton rows={6} columns={6} />}

        {!loading && invoices.length === 0 && (
          <p className="px-4 py-8 text-sm text-muted sm:px-6">
            {query.trim() || filter !== 'all'
              ? 'No invoice matches that search.'
              : 'No invoices yet. Raise the first one.'}
          </p>
        )}

        {!loading && invoices.length > 0 && (
          <>
            <ul className="divide-y divide-hairline md:hidden">
              {invoices.map((invoice) => {
                const cancelled = Boolean(invoice.cancelledAt);

                return (
                  <li key={invoice.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-sm font-medium text-brand underline underline-offset-4"
                        >
                          {invoice.number}
                        </Link>
                        <p className="mt-1 text-sm">{invoice.customer.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatInvoiceDate(invoice.createdAt)}
                          {invoice.createdBy ? ` · ${invoice.createdBy.name}` : ''}
                        </p>
                      </div>
                      <InvoiceStatus invoice={invoice} />
                    </div>
                    <p
                      className={`tabular mt-3 text-sm ${cancelled ? 'text-muted line-through' : ''}`}
                    >
                      {formatNaira(invoice.total)}
                      <span className="ml-2 text-xs text-muted no-underline">
                        Bal {formatNaira(invoice.balance)}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-widest text-muted uppercase">
                    <th className="px-6 py-3 font-normal">Invoice no.</th>
                    <th className="px-6 py-3 font-normal">Client</th>
                    <th className="px-6 py-3 font-normal">Raised by</th>
                    <th className="px-6 py-3 font-normal">Date</th>
                    <th className="px-6 py-3 font-normal">Amount</th>
                    <th className="px-6 py-3 font-normal">Paid</th>
                    <th className="px-6 py-3 font-normal">Balance</th>
                    <th className="px-6 py-3 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const cancelled = Boolean(invoice.cancelledAt);

                    return (
                      <tr key={invoice.id} className="border-t border-hairline">
                        <td className="px-6 py-3">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-brand underline underline-offset-4"
                          >
                            {invoice.number}
                          </Link>
                        </td>
                        <td className="px-6 py-3">{invoice.customer.name}</td>
                        <td className="px-6 py-3 text-muted">{invoice.createdBy?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-muted">{formatInvoiceDate(invoice.createdAt)}</td>
                        <td className={`tabular px-6 py-3 ${cancelled ? 'text-muted line-through' : ''}`}>
                          {formatNaira(invoice.total)}
                        </td>
                        <td className="tabular px-6 py-3">{formatNaira(invoice.amountPaid)}</td>
                        <td className="tabular px-6 py-3">{formatNaira(invoice.balance)}</td>
                        <td className="px-6 py-3">
                          <InvoiceStatus invoice={invoice} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && total > limit && (
          <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-sm sm:px-6">
            <p className="text-muted">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  void load(query, filter, page - 1);
                }}
                className="text-brand underline underline-offset-4 disabled:text-muted disabled:no-underline"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => {
                  setLoading(true);
                  void load(query, filter, page + 1);
                }}
                className="text-brand underline underline-offset-4 disabled:text-muted disabled:no-underline"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default InvoicesPage;

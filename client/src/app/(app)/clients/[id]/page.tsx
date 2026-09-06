'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { InvoiceStatus } from '@/components/invoice-status';
import { InlineLoader } from '@/components/loader';
import { QuotationStatus } from '@/components/quotation-status';
import { apiFetch, isApiRequestError } from '@/lib/api';
import { formatInvoiceDate, jobStatusLabel } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import {
  customerDetailResponseSchema,
  type CustomerDetail,
} from '@/lib/schemas';

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = customerDetailResponseSchema.parse(
        await apiFetch<unknown>(`/api/customers/${id}`),
      );
      setCustomer(result.customer);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <p className="text-xs">
          <Link href="/clients" className="text-brand underline underline-offset-4">
            Clients
          </Link>
        </p>
        {customer ? (
          <>
            <h1 className="mt-2 font-serif text-3xl">{customer.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {customer.phone} · {customer.address}
            </p>
            <p className="tabular mt-2 text-sm text-muted">
              {customer.invoiceCount} invoices · {customer.quotationCount ?? 0} quotations ·{' '}
              {formatNaira(customer.totalSpent)} spent
            </p>
          </>
        ) : (
          <h1 className="mt-2 font-serif text-3xl">Client</h1>
        )}
      </header>

      {loading && <InlineLoader label="Loading client" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {!loading && customer && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-card border border-hairline bg-surface">
            <div className="border-b border-hairline px-4 py-4 sm:px-6">
              <h2 className="font-serif text-xl">Invoices</h2>
            </div>

            {customer.invoices.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted sm:px-6">No invoices yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {customer.invoices.map((invoice) => {
                  const cancelled = Boolean(invoice.cancelledAt);

                  return (
                    <li key={invoice.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-sm font-medium text-brand underline underline-offset-4"
                          >
                            {invoice.number}
                          </Link>
                          <p className="mt-1 text-xs text-muted">
                            {formatInvoiceDate(invoice.createdAt)} · {jobStatusLabel(invoice.jobStatus)}
                          </p>
                        </div>
                        <InvoiceStatus invoice={invoice} />
                      </div>
                      <p
                        className={`tabular mt-2 text-sm ${cancelled ? 'text-muted line-through' : ''}`}
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
            )}
          </section>

          <section className="rounded-card border border-hairline bg-surface">
            <div className="border-b border-hairline px-4 py-4 sm:px-6">
              <h2 className="font-serif text-xl">Quotations</h2>
            </div>

            {customer.quotations.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted sm:px-6">No quotations yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {customer.quotations.map((quotation) => {
                  const cancelled =
                    Boolean(quotation.cancelledAt) || quotation.status === 'CANCELLED';

                  return (
                    <li key={quotation.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/quotations/${quotation.id}`}
                            className="text-sm font-medium text-brand underline underline-offset-4"
                          >
                            {quotation.number}
                          </Link>
                          <p className="mt-1 text-xs text-muted">
                            {formatInvoiceDate(quotation.createdAt)}
                          </p>
                        </div>
                        <QuotationStatus quotation={quotation} />
                      </div>
                      <p
                        className={`tabular mt-2 text-sm ${cancelled ? 'text-muted line-through' : ''}`}
                      >
                        {formatNaira(quotation.total)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default ClientDetailPage;

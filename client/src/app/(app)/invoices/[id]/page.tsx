'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { InvoiceForm } from '@/components/invoice-form';
import { InvoicePayment } from '@/components/invoice-payment';
import { InvoiceReceipt } from '@/components/invoice-receipt';
import { InvoiceShare } from '@/components/invoice-share';
import { InvoiceStatus } from '@/components/invoice-status';
import { InlineLoader } from '@/components/loader';
import { apiDownload, apiFetch, apiPatch, isApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatInvoiceDate, jobStatusLabel, publicInvoicePath } from '@/lib/invoice';
import {
  JOB_STATUSES,
  customersResponseSchema,
  invoiceResponseSchema,
  productsResponseSchema,
  type Customer,
  type Invoice,
  type JobStatus,
  type Product,
} from '@/lib/schemas';

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const toDatetimeLocal = (iso: string | null | undefined): string => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const load = useCallback(async () => {
    try {
      const [invoiceResult, customerResult, productResult] = await Promise.all([
        invoiceResponseSchema.parse(await apiFetch<unknown>(`/api/invoices/${id}`)),
        customersResponseSchema.parse(await apiFetch<unknown>('/api/customers')),
        productsResponseSchema.parse(await apiFetch<unknown>('/api/products')),
      ]);

      setInvoice(invoiceResult.invoice);
      setCustomers(customerResult.customers);
      setProducts(productResult.products);
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

  const cancel = async () => {
    if (!invoice) {
      return;
    }

    setCancelling(true);

    try {
      const { invoice: next } = invoiceResponseSchema.parse(
        await apiPatch<unknown>(`/api/invoices/${invoice.id}/cancel`, {}),
      );
      setInvoice(next);
      setPendingCancel(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCancelling(false);
    }
  };

  const updateJob = async (patch: { jobStatus: JobStatus; scheduledAt?: string | null }) => {
    if (!invoice || invoice.cancelledAt) {
      return;
    }

    setSavingJob(true);

    try {
      const { invoice: next } = invoiceResponseSchema.parse(
        await apiPatch<unknown>(`/api/jobs/${invoice.id}`, patch),
      );
      setInvoice(next);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSavingJob(false);
    }
  };

  const locked = Boolean(
    invoice &&
      (invoice.cancelledAt || (invoice.paymentStatus === 'PAID' && user?.role !== 'ADMIN')),
  );

  const lockReason = invoice?.cancelledAt
    ? 'This invoice was cancelled. The figures stay on file for the record.'
    : invoice?.paymentStatus === 'PAID' && user?.role !== 'ADMIN'
      ? 'This invoice is paid. Only an admin can change it.'
      : undefined;

  const canCancel =
    invoice &&
    !invoice.cancelledAt &&
    (invoice.paymentStatus !== 'PAID' || user?.role === 'ADMIN');

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs">
            <Link href="/invoices" className="text-brand underline underline-offset-4">
              Invoices
            </Link>
          </p>
          {invoice ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl">{invoice.number}</h1>
                <InvoiceStatus invoice={invoice} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {formatInvoiceDate(invoice.createdAt)}
                {invoice.createdBy ? ` · raised by ${invoice.createdBy.name}` : ''}
              </p>
            </>
          ) : (
            <h1 className="mt-2 font-serif text-3xl">Invoice</h1>
          )}
        </div>
        {invoice && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {invoice.publicToken && (
              <a
                href={`${publicInvoicePath(invoice.publicToken)}?print=1`}
                target="_blank"
                rel="noreferrer"
                className="rounded-card border border-hairline px-3 py-2 text-sm"
              >
                Print
              </a>
            )}
            <button
              type="button"
              onClick={() => void apiDownload(`/api/invoices/${invoice.id}/pdf`, `${invoice.number}.pdf`)}
              className="rounded-card border border-hairline px-3 py-2 text-sm"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-card bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Share
            </button>
            {invoice.paymentStatus === 'PAID' && !invoice.cancelledAt && (
              <button
                type="button"
                onClick={() => setReceiptOpen(true)}
                className="rounded-card border border-paid/40 bg-paid/10 px-3 py-2 text-sm font-medium text-paid"
              >
                Receipt
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => setPendingCancel(true)}
                className="w-full text-left text-sm text-cancelled underline underline-offset-4 sm:w-auto sm:text-right"
              >
                Cancel invoice
              </button>
            )}
          </div>
        )}
      </header>

      {loading && <InlineLoader label="Loading invoice" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {!loading && invoice && (
        <div className="mt-8 space-y-6">
          {!invoice.cancelledAt && (
            <section className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
              <h2 className="text-xs tracking-widest text-muted uppercase">Install job</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  Status
                  <select
                    value={invoice.jobStatus}
                    disabled={savingJob}
                    onChange={(event) =>
                      void updateJob({ jobStatus: event.target.value as JobStatus })
                    }
                    className="rounded-card mt-1 w-full border border-hairline bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-60"
                  >
                    {JOB_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {jobStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Scheduled
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(invoice.scheduledAt)}
                    disabled={savingJob}
                    onChange={(event) =>
                      void updateJob({
                        jobStatus:
                          invoice.jobStatus === 'NOT_STARTED' ? 'SCHEDULED' : invoice.jobStatus,
                        scheduledAt: event.target.value || null,
                      })
                    }
                    className="rounded-card mt-1 w-full border border-hairline bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                </label>
              </div>
            </section>
          )}

          {!locked && <InvoicePayment invoice={invoice} onSaved={setInvoice} />}
          <InvoiceForm
            mode="edit"
            initial={invoice}
            customers={customers}
            products={products}
            locked={locked}
            lockReason={lockReason}
            onSaved={(document) => setInvoice(document as Invoice)}
          />
        </div>
      )}

      {shareOpen && invoice && (
        <InvoiceShare
          invoiceId={invoice.id}
          invoiceNumber={invoice.number}
          onClose={() => setShareOpen(false)}
        />
      )}

      {receiptOpen && invoice && (
        <InvoiceReceipt invoice={invoice} onClose={() => setReceiptOpen(false)} />
      )}

      {pendingCancel && invoice && (
        <ConfirmDialog
          title={`Cancel ${invoice.number}?`}
          body="It stays on the list, struck through, and no longer counts toward the client’s total."
          confirmLabel="Cancel invoice"
          danger
          busy={cancelling}
          onCancel={() => setPendingCancel(false)}
          onConfirm={() => void cancel()}
        />
      )}
    </main>
  );
};

export default InvoiceDetailPage;

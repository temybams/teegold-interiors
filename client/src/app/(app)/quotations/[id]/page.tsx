'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { InvoiceForm } from '@/components/invoice-form';
import { InvoiceShare } from '@/components/invoice-share';
import { InlineLoader } from '@/components/loader';
import { QuotationStatus } from '@/components/quotation-status';
import { apiDownload, apiFetch, apiPatch, apiPost, isApiRequestError } from '@/lib/api';
import { formatInvoiceDate, publicQuotationPath } from '@/lib/invoice';
import {
  customersResponseSchema,
  productsResponseSchema,
  quotationConvertResponseSchema,
  quotationResponseSchema,
  type Customer,
  type Product,
  type Quotation,
} from '@/lib/schemas';

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const QuotationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [converting, setConverting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [quotationResult, customerResult, productResult] = await Promise.all([
        quotationResponseSchema.parse(await apiFetch<unknown>(`/api/quotations/${id}`)),
        customersResponseSchema.parse(await apiFetch<unknown>('/api/customers')),
        productsResponseSchema.parse(await apiFetch<unknown>('/api/products')),
      ]);

      setQuotation(quotationResult.quotation);
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
    if (!quotation) {
      return;
    }

    setCancelling(true);

    try {
      const { quotation: next } = quotationResponseSchema.parse(
        await apiPatch<unknown>(`/api/quotations/${quotation.id}/cancel`, {}),
      );
      setQuotation(next);
      setPendingCancel(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCancelling(false);
    }
  };

  const convert = async () => {
    if (!quotation) {
      return;
    }

    setConverting(true);

    try {
      const result = quotationConvertResponseSchema.parse(
        await apiPost<unknown>(`/api/quotations/${quotation.id}/convert`, {}),
      );
      router.replace(`/invoices/${result.invoice.id}`);
    } catch (caught) {
      setError(errorMessage(caught));
      setConverting(false);
    }
  };

  const locked =
    Boolean(quotation) &&
    (quotation!.status === 'CONVERTED' ||
      quotation!.status === 'CANCELLED' ||
      Boolean(quotation!.cancelledAt));

  const lockReason =
    quotation?.status === 'CONVERTED' || quotation?.invoiceId
      ? 'This quotation was converted to an invoice. Edit the invoice instead.'
      : quotation?.status === 'CANCELLED' || quotation?.cancelledAt
        ? 'This quotation was cancelled. The figures stay on file for the record.'
        : undefined;

  const canCancel = quotation && quotation.status === 'OPEN' && !quotation.cancelledAt;
  const canConvert = quotation && quotation.status === 'OPEN' && !quotation.cancelledAt;

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs">
            <Link href="/quotations" className="text-brand underline underline-offset-4">
              Quotations
            </Link>
          </p>
          {quotation ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl">{quotation.number}</h1>
                <QuotationStatus quotation={quotation} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {formatInvoiceDate(quotation.createdAt)}
                {quotation.createdBy ? ` · raised by ${quotation.createdBy.name}` : ''}
              </p>
              {quotation.invoiceId && (
                <p className="mt-2 text-sm">
                  Converted to{' '}
                  <Link
                    href={`/invoices/${quotation.invoiceId}`}
                    className="text-brand underline underline-offset-4"
                  >
                    {quotation.invoiceNumber ?? 'invoice'}
                  </Link>
                </p>
              )}
            </>
          ) : (
            <h1 className="mt-2 font-serif text-3xl">Quotation</h1>
          )}
        </div>
        {quotation && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {quotation.publicToken && (
              <a
                href={`${publicQuotationPath(quotation.publicToken)}?print=1`}
                target="_blank"
                rel="noreferrer"
                className="rounded-card border border-hairline px-3 py-2 text-sm"
              >
                Print
              </a>
            )}
            <button
              type="button"
              onClick={() =>
                void apiDownload(`/api/quotations/${quotation.id}/pdf`, `${quotation.number}.pdf`)
              }
              className="rounded-card border border-hairline px-3 py-2 text-sm"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-card border border-hairline px-3 py-2 text-sm"
            >
              Share
            </button>
            {canConvert && (
              <button
                type="button"
                disabled={converting}
                onClick={() => void convert()}
                className="rounded-card bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {converting ? 'Converting…' : 'Convert to invoice'}
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => setPendingCancel(true)}
                className="w-full text-left text-sm text-cancelled underline underline-offset-4 sm:w-auto sm:text-right"
              >
                Cancel quotation
              </button>
            )}
          </div>
        )}
      </header>

      {loading && <InlineLoader label="Loading quotation" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {!loading && quotation && (
        <div className="mt-8">
          <InvoiceForm
            mode="edit"
            kind="quotation"
            initial={quotation}
            customers={customers}
            products={products}
            locked={locked}
            lockReason={lockReason}
            onSaved={(document) => setQuotation(document as Quotation)}
          />
        </div>
      )}

      {shareOpen && quotation && (
        <InvoiceShare
          invoiceId={quotation.id}
          invoiceNumber={quotation.number}
          basePath="/api/quotations"
          onClose={() => setShareOpen(false)}
        />
      )}

      {pendingCancel && quotation && (
        <ConfirmDialog
          title={`Cancel ${quotation.number}?`}
          body="It stays on the list, struck through, and can no longer be converted."
          confirmLabel="Cancel quotation"
          danger
          busy={cancelling}
          onCancel={() => setPendingCancel(false)}
          onConfirm={() => void cancel()}
        />
      )}
    </main>
  );
};

export default QuotationDetailPage;

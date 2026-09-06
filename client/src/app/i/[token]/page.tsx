'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InvoiceDocument } from '@/components/invoice-document';
import { InlineLoader } from '@/components/loader';
import { Wordmark } from '@/components/wordmark';
import { apiBaseUrl, downloadPublicPdf, isApiRequestError } from '@/lib/api';
import { publicInvoiceResponseSchema, type Company, type PublicInvoiceView } from '@/lib/schemas';

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not load this invoice.';

const PublicInvoicePage = () => {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const asReceipt = search.get('receipt') === '1';
  const [invoice, setInvoice] = useState<PublicInvoiceView | null>(null);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/public/invoices/${token}`);
        const body: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof body === 'object' &&
            body &&
            'error' in body &&
            typeof (body as { error?: { message?: string } }).error?.message === 'string'
              ? (body as { error: { message: string } }).error.message
              : 'Invoice not found';
          throw Object.assign(new Error(message), { name: 'ApiRequestError', status: response.status });
        }

        const parsed = publicInvoiceResponseSchema.parse(body);

        if (!cancelled) {
          setInvoice(parsed.invoice);
          setCompany(parsed.company);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(errorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (invoice && search.get('print') === '1') {
      window.print();
    }
  }, [invoice, search]);

  const variant = asReceipt || invoice?.paymentStatus === 'PAID' ? 'receipt' : 'invoice';
  const pdfName =
    invoice && variant === 'receipt' ? `${invoice.number}-receipt.pdf` : `${invoice?.number ?? 'invoice'}.pdf`;

  return (
    <div className="min-h-screen bg-page text-page-ink">
      <header className="invoice-actions mx-auto flex max-w-[720px] items-center justify-between gap-3 px-4 py-4">
        <Wordmark
          markClassName="size-8 shrink-0 text-page-ink"
          textClassName="truncate font-serif text-sm tracking-[0.16em] uppercase"
        />
        {invoice && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-card border border-page-hairline px-3 py-2 text-xs sm:text-sm"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() =>
                void downloadPublicPdf(token, pdfName, variant === 'receipt' ? 'receipt' : 'invoice')
              }
              className="rounded-card bg-brand px-3 py-2 text-xs font-medium text-white sm:text-sm"
            >
              Download PDF
            </button>
          </div>
        )}
      </header>

      <main className="px-4 pb-16">
        {loading && <InlineLoader label="Opening invoice" />}
        {error && <p className="mx-auto mt-10 max-w-[720px] text-sm text-cancelled">{error}</p>}
        {invoice && (
          <div className="rounded-card border border-page-hairline px-4 py-8 sm:px-10 print:border-0 print:px-0 print:py-0">
            <InvoiceDocument invoice={invoice} variant={variant} company={company} />
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicInvoicePage;

'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InvoiceDocument } from '@/components/invoice-document';
import { InlineLoader } from '@/components/loader';
import { Wordmark } from '@/components/wordmark';
import { apiBaseUrl, downloadPublicPdf, isApiRequestError } from '@/lib/api';
import {
  publicQuotationResponseSchema,
  type Company,
  type Quotation,
} from '@/lib/schemas';

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not load this quotation.';

const PublicQuotationPage = () => {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/public/quotations/${token}`);
        const body: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof body === 'object' &&
            body &&
            'error' in body &&
            typeof (body as { error?: { message?: string } }).error?.message === 'string'
              ? (body as { error: { message: string } }).error.message
              : 'Quotation not found';
          throw Object.assign(new Error(message), { name: 'ApiRequestError', status: response.status });
        }

        const parsed = publicQuotationResponseSchema.parse(body);

        if (!cancelled) {
          setQuotation(parsed.quotation);
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
    if (quotation && search.get('print') === '1') {
      window.print();
    }
  }, [quotation, search]);

  return (
    <div className="min-h-screen bg-page text-page-ink">
      <header className="invoice-actions mx-auto flex max-w-[720px] items-center justify-between gap-3 px-4 py-4">
        <Wordmark
          markClassName="size-8 shrink-0 text-page-ink"
          textClassName="truncate font-serif text-sm tracking-[0.16em] uppercase"
        />
        {quotation && (
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
              onClick={() => void downloadPublicPdf(token, `${quotation.number}.pdf`, 'quotation')}
              className="rounded-card bg-brand px-3 py-2 text-xs font-medium text-white sm:text-sm"
            >
              Download PDF
            </button>
          </div>
        )}
      </header>

      <main className="px-4 pb-16">
        {loading && <InlineLoader label="Opening quotation" />}
        {error && <p className="mx-auto mt-10 max-w-[720px] text-sm text-cancelled">{error}</p>}
        {quotation && (
          <div className="rounded-card border border-page-hairline px-4 py-8 sm:px-10 print:border-0 print:px-0 print:py-0">
            <InvoiceDocument invoice={quotation} variant="quotation" company={company} />
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicQuotationPage;

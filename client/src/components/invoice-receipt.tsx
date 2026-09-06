'use client';

import { useEffect, useState } from 'react';

import { apiDownload, apiFetch, isApiRequestError } from '@/lib/api';
import { formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/phone';
import { invoiceShareSchema, type Invoice } from '@/lib/schemas';

type InvoiceReceiptProps = {
  invoice: Invoice;
  onClose: () => void;
};

export const InvoiceReceipt = ({ invoice, onClose }: InvoiceReceiptProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const share = invoiceShareSchema.parse(
          await apiFetch<unknown>(`/api/invoices/${invoice.id}/share`),
        );

        if (!cancelled) {
          setUrl(share.url);
          setPhone(share.phone);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(isApiRequestError(caught) ? caught.message : 'Could not prepare the receipt.');
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
  }, [invoice.id]);

  const receiptUrl = url ? `${url}?receipt=1` : null;
  const message = receiptUrl
    ? `Hello ${invoice.customer.name.split(/\s+/)[0] ?? invoice.customer.name}, here is your Teegold Interiors receipt for ${invoice.number}. Amount paid: ${formatNaira(invoice.amountPaid || invoice.total)}. ${receiptUrl}`
    : '';
  const chat = receiptUrl ? whatsappUrl(phone, message) : null;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    if (!receiptUrl) {
      return;
    }

    await navigator.clipboard.writeText(receiptUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="absolute inset-x-0 bottom-0 rounded-t-lg border border-hairline bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="receipt-title" className="font-serif text-2xl">
          Receipt · {invoice.number}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Paid in full · {formatNaira(invoice.amountPaid || invoice.total)}
        </p>

        {loading && <p className="mt-4 text-sm text-muted">Preparing…</p>}
        {error && <p className="mt-4 text-sm text-cancelled">{error}</p>}

        {!loading && !error && (
          <div className="mt-5 flex flex-col gap-3">
            {invoice.publicToken && (
              <a
                href={`/i/${invoice.publicToken}?receipt=1&print=1`}
                target="_blank"
                rel="noreferrer"
                className="rounded-card bg-brand px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-dark"
              >
                Print receipt
              </a>
            )}

            <button
              type="button"
              onClick={() =>
                void apiDownload(
                  `/api/invoices/${invoice.id}/pdf?variant=receipt`,
                  `${invoice.number}-receipt.pdf`,
                )
              }
              className="rounded-card border border-hairline px-4 py-2.5 text-sm hover:border-brand"
            >
              Download receipt PDF
            </button>

            {canNativeShare && receiptUrl && (
              <button
                type="button"
                onClick={() =>
                  void navigator.share({
                    title: `Receipt ${invoice.number}`,
                    text: message,
                    url: receiptUrl,
                  })
                }
                className="rounded-card border border-hairline px-4 py-2.5 text-sm hover:border-brand"
              >
                Share from this phone
              </button>
            )}

            {chat && (
              <a
                href={chat}
                target="_blank"
                rel="noreferrer"
                className="rounded-card border border-hairline px-4 py-2.5 text-center text-sm hover:border-brand"
              >
                WhatsApp receipt
              </a>
            )}

            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-card border border-hairline px-4 py-2.5 text-sm hover:border-brand"
            >
              {copied ? 'Copied' : 'Copy receipt link'}
            </button>

            {receiptUrl && <p className="break-all text-xs text-muted">{receiptUrl}</p>}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 text-sm text-muted underline underline-offset-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};

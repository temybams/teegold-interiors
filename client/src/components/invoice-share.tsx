'use client';

import { useEffect, useState } from 'react';

import { apiDownload, apiFetch, apiPost, isApiRequestError } from '@/lib/api';
import { whatsappUrl } from '@/lib/phone';
import { invoiceEmailResponseSchema, invoiceShareSchema } from '@/lib/schemas';

type InvoiceShareProps = {
  invoiceId: string;
  invoiceNumber: string;
  /** Defaults to invoices. Use quotations for quote share (no email). */
  basePath?: '/api/invoices' | '/api/quotations';
  onClose: () => void;
};

export const InvoiceShare = ({
  invoiceId,
  invoiceNumber,
  basePath = '/api/invoices',
  onClose,
}: InvoiceShareProps) => {
  const isQuotation = basePath === '/api/quotations';
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const share = invoiceShareSchema.parse(
          await apiFetch<unknown>(`${basePath}/${invoiceId}/share`),
        );

        if (!cancelled) {
          setUrl(share.url);
          setMessage(share.message);
          setPhone(share.phone);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(isApiRequestError(caught) ? caught.message : 'Could not prepare the share link.');
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
  }, [basePath, invoiceId]);

  const chat = url ? whatsappUrl(phone, message) : null;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    if (!url) {
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const nativeShare = async () => {
    if (!url || !canNativeShare) {
      return;
    }

    await navigator.share({ title: invoiceNumber, text: message, url });
  };

  const sendEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const result = invoiceEmailResponseSchema.parse(
        await apiPost<unknown>(`${basePath}/${invoiceId}/email`, { email }),
      );
      setStatus(result.message);
    } catch (caught) {
      setError(isApiRequestError(caught) ? caught.message : 'Could not send the email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="absolute inset-x-0 bottom-0 rounded-t-lg border border-hairline bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="share-title" className="font-serif text-2xl">
          Share {invoiceNumber}
        </h2>
        <p className="mt-1 text-sm text-muted">
          WhatsApp opens a chat. Attach the PDF from Downloads if they need the file.
        </p>

        {loading && <p className="mt-4 text-sm text-muted">Preparing the link…</p>}
        {error && <p className="mt-4 text-sm text-cancelled">{error}</p>}
        {status && <p className="mt-4 text-sm text-paid">{status}</p>}

        {url && (
          <div className="mt-5 flex flex-col gap-3">
            {canNativeShare && (
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Share from this phone
              </button>
            )}

            {chat ? (
              <a
                href={chat}
                target="_blank"
                rel="noreferrer"
                className="rounded-card border border-hairline px-4 py-2.5 text-center text-sm hover:border-brand"
              >
                WhatsApp
              </a>
            ) : (
              <p className="text-sm text-muted">This client has no WhatsApp number on file.</p>
            )}

            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-card border border-hairline px-4 py-2.5 text-sm hover:border-brand"
            >
              {copied ? 'Copied' : isQuotation ? 'Copy quotation link' : 'Copy invoice link'}
            </button>

            <button
              type="button"
              onClick={() => void apiDownload(`${basePath}/${invoiceId}/pdf`, `${invoiceNumber}.pdf`)}
              className="rounded-card border border-hairline px-4 py-2.5 text-sm hover:border-brand"
            >
              Download PDF
            </button>

            {!isQuotation && (
              <form onSubmit={sendEmail} className="border-t border-hairline pt-3">
                <label className="block text-sm">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="client@email.com"
                    className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </label>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-card mt-3 w-full border border-hairline px-4 py-2.5 text-sm hover:border-brand disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Email PDF'}
                </button>
              </form>
            )}

            <p className="break-all text-xs text-muted">{url}</p>
          </div>
        )}

        <button type="button" onClick={onClose} className="mt-5 text-sm text-muted underline underline-offset-4">
          Close
        </button>
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';

import { apiPatch, isApiRequestError } from '@/lib/api';
import { formatNaira } from '@/lib/money';
import { invoiceResponseSchema, type Invoice } from '@/lib/schemas';

type InvoicePaymentProps = {
  invoice: Invoice;
  onSaved: (invoice: Invoice) => void;
};

export const InvoicePayment = ({ invoice, onSaved }: InvoicePaymentProps) => {
  const [amount, setAmount] = useState(String(invoice.amountPaid || invoice.total));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (invoice.cancelledAt) {
    return null;
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { invoice: next } = invoiceResponseSchema.parse(
        await apiPatch<unknown>(`/api/invoices/${invoice.id}/payment`, {
          amountPaid: Number(amount),
        }),
      );
      onSaved(next);
      setAmount(String(next.amountPaid));
    } catch (caught) {
      setError(isApiRequestError(caught) ? caught.message : 'Could not record payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-card mb-6 border border-hairline bg-surface p-4 sm:p-6">
      <h2 className="text-xs tracking-widest text-muted uppercase">Record payment</h2>
      <p className="mt-1 text-sm text-muted">
        Total {formatNaira(invoice.total)} · already paid {formatNaira(invoice.amountPaid)} · balance{' '}
        {formatNaira(invoice.balance)}
      </p>

      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm">Amount paid so far</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            className="rounded-card tabular mt-1 w-40 border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save payment'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setAmount(String(invoice.total))}
          className="rounded-card border border-hairline px-3 py-2.5 text-sm disabled:opacity-60"
        >
          Mark fully paid
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-cancelled">{error}</p>}
    </section>
  );
};

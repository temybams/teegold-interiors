'use client';

import { useEffect, useState } from 'react';

import { apiPatch, isApiRequestError } from '@/lib/api';
import { formatNaira } from '@/lib/money';
import { invoiceResponseSchema, type Invoice } from '@/lib/schemas';

type InvoicePaymentProps = {
  invoice: Invoice;
  onSaved: (invoice: Invoice) => void;
};

const parseAmount = (value: string): number | null => {
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) {
    return null;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export const InvoicePayment = ({ invoice, onSaved }: InvoicePaymentProps) => {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = Math.round(invoice.balance);
  const paid = Math.round(invoice.amountPaid);
  const total = Math.round(invoice.total);

  useEffect(() => {
    setAmount('');
    setError(null);
  }, [invoice.id, invoice.amountPaid, invoice.balance]);

  if (invoice.cancelledAt || invoice.paymentStatus === 'PAID' || balance <= 0) {
    return null;
  }

  const payment = parseAmount(amount);
  const exceedsBalance = payment != null && payment > balance;

  const save = async (thisPayment: number) => {
    const rounded = Math.round(thisPayment);

    if (rounded <= 0) {
      setError('Enter how much was paid this time.');
      return;
    }

    if (rounded > balance) {
      setError(`Payment cannot exceed the balance of ${formatNaira(balance)}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { invoice: next } = invoiceResponseSchema.parse(
        await apiPatch<unknown>(`/api/invoices/${invoice.id}/payment`, {
          payment: rounded,
        }),
      );
      onSaved(next);
      setAmount('');
    } catch (caught) {
      setError(isApiRequestError(caught) ? caught.message : 'Could not record payment.');
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (payment == null) {
      setError('Enter how much was paid this time.');
      return;
    }

    void save(payment);
  };

  return (
    <section className="rounded-card mb-6 border border-hairline bg-surface p-4 sm:p-6">
      <h2 className="text-xs tracking-widest text-muted uppercase">Record payment</h2>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-card border border-hairline bg-canvas px-3 py-3">
          <dt className="text-xs tracking-wide text-muted uppercase">Total</dt>
          <dd className="tabular mt-1 font-medium">{formatNaira(total)}</dd>
        </div>
        <div className="rounded-card border border-hairline bg-canvas px-3 py-3">
          <dt className="text-xs tracking-wide text-muted uppercase">Paid</dt>
          <dd className="tabular mt-1 font-medium">{formatNaira(paid)}</dd>
        </div>
        <div className="rounded-card border border-brand/20 bg-lilac/60 px-3 py-3">
          <dt className="text-xs tracking-wide text-brand uppercase">Balance</dt>
          <dd className="tabular mt-1 font-medium text-brand">{formatNaira(balance)}</dd>
        </div>
      </dl>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <label className="block max-w-xs">
          <span className="text-sm font-medium">This payment</span>
          <span className="mt-0.5 block text-xs text-muted">
            How much is being paid now — not the running total. Max {formatNaira(balance)}.
          </span>
          <input
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^\d]/g, ''));
              setError(null);
            }}
            inputMode="numeric"
            placeholder="0"
            max={balance}
            aria-invalid={exceedsBalance}
            className={`rounded-card tabular mt-2 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
              exceedsBalance ? 'border-cancelled' : 'border-hairline'
            }`}
          />
        </label>

        {exceedsBalance && (
          <p className="text-sm text-cancelled">
            That is more than the balance of {formatNaira(balance)}.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || exceedsBalance || payment == null || payment <= 0}
            className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save payment'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(balance)}
            className="rounded-card border border-hairline px-4 py-2.5 text-sm hover:bg-canvas disabled:opacity-60"
          >
            {saving ? 'Saving…' : `Pay remaining ${formatNaira(balance)}`}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-cancelled">{error}</p>}
    </section>
  );
};

'use client';

import { useState } from 'react';

import { apiPost, isApiRequestError, type ApiIssue } from '@/lib/api';
import { formatNaira } from '@/lib/money';
import { calculateArea } from '@/lib/pricing';
import { linePreviewSchema, type LinePreview } from '@/lib/schemas';

const initialForm = {
  width: '1.0',
  height: '2.0',
  unitPrice: '25000',
};

type FormState = typeof initialForm;

const issueFor = (issues: ApiIssue[], field: keyof FormState): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

/**
 * Proves the round trip end to end: the browser shows the area instantly, the server
 * re-validates the line through validations/ and returns the figure that will be saved.
 */
export const MeasurementPreview = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<LinePreview | null>(null);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Instant, browser-side geometry while the server stays the authority on money.
  const localArea = calculateArea(Number(form.width) || 0, Number(form.height) || 0);

  const update = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setIssues([]);
    setMessage(null);

    try {
      const body = await apiPost<unknown>('/api/pricing/preview', {
        pricingType: 'PER_M2',
        width: form.width,
        height: form.height,
        unitPrice: form.unitPrice,
      });

      setPreview(linePreviewSchema.parse(body));
    } catch (error) {
      setPreview(null);

      if (isApiRequestError(error)) {
        setIssues(error.issues);
        setMessage(error.issues.length > 0 ? null : error.message);
      } else {
        setMessage(error instanceof Error ? error.message : 'Something went wrong');
      }
    } finally {
      setPending(false);
    }
  };

  const fields: { key: keyof FormState; label: string; suffix: string }[] = [
    { key: 'width', label: 'Width', suffix: 'm' },
    { key: 'height', label: 'Height', suffix: 'm' },
    { key: 'unitPrice', label: 'Price per m²', suffix: '₦' },
  ];

  return (
    <form onSubmit={submit} className="rounded-card border border-hairline bg-surface p-6">
      <h2 className="text-xs tracking-[0.12em] text-muted uppercase">
        Measurement check — Zebra Blind
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {fields.map((field) => {
          const issue = issueFor(issues, field.key);

          return (
            <label key={field.key} className="block">
              <span className="text-xs text-muted">{field.label}</span>
              <span className="relative mt-1 block">
                <input
                  value={form[field.key]}
                  onChange={update(field.key)}
                  inputMode="decimal"
                  className={`rounded-card tabular w-full border px-3 py-2 pr-8 text-sm outline-none focus:border-brand ${
                    issue ? 'border-cancelled' : 'border-hairline'
                  }`}
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">
                  {field.suffix}
                </span>
              </span>
              {issue && <span className="mt-1 block text-xs text-cancelled">{issue}</span>}
            </label>
          );
        })}
      </div>

      <div className="rounded-card mt-4 bg-lilac px-4 py-3">
        <p className="text-xs tracking-[0.12em] text-brand uppercase">Area</p>
        <p className="tabular mt-1 text-2xl font-semibold">
          {localArea.toFixed(2)} m<sup>2</sup>
        </p>
        <p className="mt-1 text-xs text-muted">Width × Height, calculated in the browser</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-card mt-4 w-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? 'Checking…' : 'Confirm with the server'}
      </button>

      {preview && (
        <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Server area</dt>
            <dd className="tabular">
              {preview.quantity.toFixed(2)} {preview.unit}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Line total</dt>
            <dd className="tabular font-semibold">{preview.lineTotalFormatted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Formatted in the browser</dt>
            <dd className="tabular">{formatNaira(preview.lineTotal)}</dd>
          </div>
        </dl>
      )}

      {message && (
        <p className="mt-4 border-t border-hairline pt-4 text-sm text-cancelled">{message}</p>
      )}

      {issues.length > 0 && (
        <p className="mt-4 border-t border-hairline pt-4 text-xs text-muted">
          Those errors came from <code className="text-ink">server/src/validations</code>, not the
          browser — clear a field and try again to see it reject the request.
        </p>
      )}
    </form>
  );
};

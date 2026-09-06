'use client';

import { useMemo, useState } from 'react';

import { apiPatch, apiPost, isApiRequestError, type ApiIssue } from '@/lib/api';
import { formatMeasurement } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import {
  calculateLineTotal,
  calculateQuantity,
  calculateTotals,
  isMeasured,
} from '@/lib/pricing';
import { invoiceResponseSchema, quotationResponseSchema, type Customer, type Invoice, type Product, type Quotation } from '@/lib/schemas';

type DraftLine = {
  key: string;
  productId: string;
  width: string;
  height: string;
  quantity: string;
  nameSnapshot?: string;
};

type CustomerMode = 'existing' | 'new';

type NewCustomer = {
  name: string;
  phone: string;
  address: string;
};

const emptyCustomer = (): NewCustomer => ({ name: '', phone: '', address: '' });

const newLine = (): DraftLine => ({
  key: crypto.randomUUID(),
  productId: '',
  width: '',
  height: '',
  quantity: '1',
});

type DocumentLike = Invoice | Quotation;

const linesFromDocument = (document: DocumentLike): DraftLine[] =>
  document.items.map((item) => ({
    key: item.id,
    productId: item.productId ?? '',
    width: item.width != null ? String(item.width) : '',
    height: item.height != null ? String(item.height) : '',
    quantity: item.pricingType === 'PER_M2' ? '' : String(item.quantity),
    nameSnapshot: item.nameSnapshot,
  }));

const issueFor = (issues: ApiIssue[], field: string): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

type InvoiceFormProps = {
  mode: 'create' | 'edit';
  kind?: 'invoice' | 'quotation';
  customers: Customer[];
  products: Product[];
  initial?: DocumentLike;
  locked?: boolean;
  lockReason?: string;
  onSaved: (document: DocumentLike) => void;
};

export const InvoiceForm = ({
  mode,
  kind = 'invoice',
  customers,
  products,
  initial,
  locked,
  lockReason,
  onSaved,
}: InvoiceFormProps) => {
  const isQuotation = kind === 'quotation';
  const [customerMode, setCustomerMode] = useState<CustomerMode>(
    initial || customers.length > 0 ? 'existing' : 'new',
  );
  const [customerId, setCustomerId] = useState(initial?.customer.id ?? '');
  const [newCustomer, setNewCustomer] = useState<NewCustomer>(emptyCustomer);
  const [lines, setLines] = useState<DraftLine[]>(
    initial ? linesFromDocument(initial) : [newLine()],
  );
  const [discount, setDiscount] = useState(initial ? String(initial.discount) : '0');
  const [paid, setPaid] = useState(
    initial && 'paymentStatus' in initial ? initial.paymentStatus === 'PAID' : false,
  );
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const alreadyOnInvoice = useMemo(
    () => new Set(initial?.items.map((item) => item.productId).filter((value): value is string => Boolean(value))),
    [initial],
  );

  const pickerProducts = useMemo(
    () => products.filter((product) => product.active || alreadyOnInvoice.has(product.id)),
    [alreadyOnInvoice, products],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const previewLines = lines.map((line) => {
    const product = productById.get(line.productId);
    const pricingType = product?.pricingType;
    const unitPrice = product?.unitPrice ?? 0;
    const measured = pricingType ? isMeasured(pricingType) : false;
    const width = Number(line.width);
    const height = Number(line.height);
    const quantity = Number(line.quantity);

    if (!product || !pricingType) {
      return { line, product, measured, quantity: 0, unitPrice: 0, lineTotal: 0 };
    }

    const input = {
      pricingType,
      unitPrice,
      width: measured && width > 0 ? width : undefined,
      height: measured && height > 0 ? height : undefined,
      quantity: !measured && quantity > 0 ? quantity : undefined,
    };

    return {
      line,
      product,
      measured,
      quantity: calculateQuantity(input),
      unitPrice,
      lineTotal: calculateLineTotal(input),
    };
  });

  const totals = calculateTotals(
    previewLines.map((row) => row.lineTotal),
    Number(discount) || 0,
  );

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    if (locked) {
      return;
    }

    setSaving(true);
    setIssues([]);
    setFormError(null);

    const items = lines
      .filter((line) => line.productId)
      .map((line) => {
        const product = productById.get(line.productId);
        const measured = product ? isMeasured(product.pricingType) : false;

        return {
          productId: line.productId,
          ...(measured
            ? { width: Number(line.width), height: Number(line.height) }
            : { quantity: Number(line.quantity) }),
        };
      });

    const body = {
      ...(customerMode === 'existing'
        ? { customerId: customerId || undefined }
        : { customer: newCustomer }),
      discount: Number(discount) || 0,
      ...(isQuotation ? {} : { paid }),
      items,
    };

    try {
      const base = isQuotation ? '/api/quotations' : '/api/invoices';
      const path = mode === 'edit' && initial ? `${base}/${initial.id}` : base;
      const payload =
        mode === 'edit'
          ? await apiPatch<unknown>(path, body)
          : await apiPost<unknown>(path, body);

      if (isQuotation) {
        onSaved(quotationResponseSchema.parse(payload).quotation);
      } else {
        onSaved(invoiceResponseSchema.parse(payload).invoice);
      }
    } catch (caught) {
      if (isApiRequestError(caught)) {
        setIssues(caught.issues);
        setFormError(caught.issues.length > 0 ? null : caught.message);
      } else {
        setFormError(errorMessage(caught));
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  return (
    <form onSubmit={save} className="space-y-6">
      {lockReason && (
        <p className="rounded-card border border-hairline bg-lilac px-4 py-3 text-sm">{lockReason}</p>
      )}

      <section className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
        <h2 className="text-xs tracking-widest text-muted uppercase">Client</h2>

        {!locked && (
          <div className="mt-3 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="customerMode"
                checked={customerMode === 'existing'}
                onChange={() => setCustomerMode('existing')}
              />
              Existing client
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="customerMode"
                checked={customerMode === 'new'}
                onChange={() => setCustomerMode('new')}
              />
              New client
            </label>
          </div>
        )}

        {customerMode === 'existing' ? (
          <label className="mt-4 block">
            <span className="text-sm">Choose a client</span>
            <select
              value={customerId}
              disabled={locked}
              onChange={(event) => setCustomerId(event.target.value)}
              className={`rounded-card mt-1 w-full max-w-md border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'customerId') ? 'border-cancelled' : 'border-hairline'
              }`}
            >
              <option value="">Select…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.phone}
                </option>
              ))}
            </select>
            {issueFor(issues, 'customerId') && (
              <span className="mt-1 block text-xs text-cancelled">
                {issueFor(issues, 'customerId')}
              </span>
            )}
            {selectedCustomer && (
              <p className="mt-2 text-sm text-muted">{selectedCustomer.address}</p>
            )}
          </label>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm">Name</span>
              <input
                value={newCustomer.name}
                disabled={locked}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, name: event.target.value }))
                }
                className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                  issueFor(issues, 'customer.name') ? 'border-cancelled' : 'border-hairline'
                }`}
              />
              {issueFor(issues, 'customer.name') && (
                <span className="mt-1 block text-xs text-cancelled">
                  {issueFor(issues, 'customer.name')}
                </span>
              )}
            </label>
            <label className="block">
              <span className="text-sm">Phone</span>
              <input
                value={newCustomer.phone}
                disabled={locked}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, phone: event.target.value }))
                }
                className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                  issueFor(issues, 'customer.phone') ? 'border-cancelled' : 'border-hairline'
                }`}
              />
              {issueFor(issues, 'customer.phone') && (
                <span className="mt-1 block text-xs text-cancelled">
                  {issueFor(issues, 'customer.phone')}
                </span>
              )}
            </label>
            <label className="block">
              <span className="text-sm">Address</span>
              <input
                value={newCustomer.address}
                disabled={locked}
                onChange={(event) =>
                  setNewCustomer((current) => ({ ...current, address: event.target.value }))
                }
                className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                  issueFor(issues, 'customer.address') ? 'border-cancelled' : 'border-hairline'
                }`}
              />
              {issueFor(issues, 'customer.address') && (
                <span className="mt-1 block text-xs text-cancelled">
                  {issueFor(issues, 'customer.address')}
                </span>
              )}
            </label>
          </div>
        )}
      </section>

      <section className="rounded-card overflow-x-auto border border-hairline bg-surface">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <h2 className="text-xs tracking-widest text-muted uppercase">Items</h2>
          {!locked && (
            <button
              type="button"
              onClick={() => setLines((current) => [...current, newLine()])}
              className="text-xs text-brand underline underline-offset-4"
            >
              Add item
            </button>
          )}
        </div>

        {pickerProducts.length === 0 && (
          <p className="px-6 pb-3 text-sm text-muted">
            There are no active products in the catalogue yet.
          </p>
        )}

        {issueFor(issues, 'items') && (
          <p className="px-6 pb-3 text-xs text-cancelled">{issueFor(issues, 'items')}</p>
        )}

        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs tracking-widest text-muted uppercase">
              <th className="px-6 py-3 font-normal">Item</th>
              <th className="px-6 py-3 font-normal">Measurement</th>
              <th className="px-6 py-3 font-normal">Qty</th>
              <th className="px-6 py-3 font-normal">Unit price</th>
              <th className="px-6 py-3 font-normal">Total</th>
              {!locked && <th className="px-6 py-3 font-normal" />}
            </tr>
          </thead>
          <tbody>
            {previewLines.map((row, index) => {
              const { line, product, measured } = row;
              const missing =
                Boolean(line.productId) &&
                !product &&
                Boolean(line.nameSnapshot);

              return (
                <tr key={line.key} className="border-t border-hairline align-top">
                  <td className="px-6 py-3">
                    <select
                      value={line.productId}
                      disabled={locked}
                      onChange={(event) =>
                        updateLine(line.key, { productId: event.target.value })
                      }
                      className={`rounded-card w-full min-w-[12rem] border px-3 py-2 text-sm outline-none focus:border-brand ${
                        issueFor(issues, `items.${index}.productId`)
                          ? 'border-cancelled'
                          : 'border-hairline'
                      }`}
                    >
                      <option value="">Select a product…</option>
                      {missing && line.productId && (
                        <option value={line.productId}>{line.nameSnapshot} (unavailable)</option>
                      )}
                      {pickerProducts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {!item.active ? ' (disabled)' : ''}
                        </option>
                      ))}
                    </select>
                    {issueFor(issues, `items.${index}.productId`) && (
                      <span className="mt-1 block text-xs text-cancelled">
                        {issueFor(issues, `items.${index}.productId`)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {measured ? (
                      <div className="flex gap-2">
                        <label className="block w-20">
                          <span className="sr-only">Width</span>
                          <input
                            value={line.width}
                            disabled={locked}
                            onChange={(event) =>
                              updateLine(line.key, { width: event.target.value })
                            }
                            placeholder="W"
                            inputMode="decimal"
                            className={`rounded-card tabular w-full border px-2 py-2 text-sm outline-none focus:border-brand ${
                              issueFor(issues, `items.${index}.width`)
                                ? 'border-cancelled'
                                : 'border-hairline'
                            }`}
                          />
                        </label>
                        <span className="self-center text-muted">×</span>
                        <label className="block w-20">
                          <span className="sr-only">Height</span>
                          <input
                            value={line.height}
                            disabled={locked}
                            onChange={(event) =>
                              updateLine(line.key, { height: event.target.value })
                            }
                            placeholder="H"
                            inputMode="decimal"
                            className={`rounded-card tabular w-full border px-2 py-2 text-sm outline-none focus:border-brand ${
                              issueFor(issues, `items.${index}.height`)
                                ? 'border-cancelled'
                                : 'border-hairline'
                            }`}
                          />
                        </label>
                        <span className="self-center text-xs text-muted">m</span>
                      </div>
                    ) : (
                      <span className="text-muted">
                        {product
                          ? '—'
                          : line.width && line.height
                            ? formatMeasurement({
                                width: Number(line.width),
                                height: Number(line.height),
                              })
                            : '—'}
                      </span>
                    )}
                    {(issueFor(issues, `items.${index}.width`) ||
                      issueFor(issues, `items.${index}.height`)) && (
                      <span className="mt-1 block text-xs text-cancelled">
                        {issueFor(issues, `items.${index}.width`) ||
                          issueFor(issues, `items.${index}.height`)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {measured ? (
                      <span className="tabular text-muted">
                        {row.quantity > 0 ? `${row.quantity.toFixed(2)} m²` : '—'}
                      </span>
                    ) : (
                      <input
                        value={line.quantity}
                        disabled={locked || !product}
                        onChange={(event) =>
                          updateLine(line.key, { quantity: event.target.value })
                        }
                        inputMode="decimal"
                        className={`rounded-card tabular w-20 border px-2 py-2 text-sm outline-none focus:border-brand ${
                          issueFor(issues, `items.${index}.quantity`)
                            ? 'border-cancelled'
                            : 'border-hairline'
                        }`}
                      />
                    )}
                    {issueFor(issues, `items.${index}.quantity`) && (
                      <span className="mt-1 block text-xs text-cancelled">
                        {issueFor(issues, `items.${index}.quantity`)}
                      </span>
                    )}
                  </td>
                  <td className="tabular px-6 py-3">
                    {product ? formatNaira(row.unitPrice) : '—'}
                  </td>
                  <td className="tabular px-6 py-3 font-medium">
                    {product && row.lineTotal > 0 ? formatNaira(row.lineTotal) : '—'}
                  </td>
                  {!locked && (
                    <td className="px-6 py-3 text-right">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLines((current) => current.filter((item) => item.key !== line.key))
                          }
                          className="text-xs text-cancelled underline underline-offset-4"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
        <div className="ml-auto max-w-sm space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="tabular">{formatNaira(totals.subtotal)}</span>
          </div>
          <label className="flex items-center justify-between gap-4">
            <span className="text-muted">Discount</span>
            <input
              value={discount}
              disabled={locked}
              onChange={(event) => setDiscount(event.target.value)}
              inputMode="numeric"
              className={`rounded-card tabular w-32 border px-3 py-2 text-right text-sm outline-none focus:border-brand ${
                issueFor(issues, 'discount') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
          </label>
          <div className="flex justify-between border-t border-hairline pt-3">
            <span className="font-medium">Total</span>
            <span className="tabular text-lg font-semibold">{formatNaira(totals.total)}</span>
          </div>
          {!isQuotation && (
            <label className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={paid}
                disabled={locked}
                onChange={(event) => setPaid(event.target.checked)}
              />
              This invoice is paid
            </label>
          )}
        </div>

        {formError && <p className="mt-4 text-sm text-cancelled">{formError}</p>}

        {!locked && (
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving
                ? 'Saving…'
                : mode === 'edit'
                  ? 'Save changes'
                  : isQuotation
                    ? 'Save quotation'
                    : 'Save invoice'}
            </button>
          </div>
        )}
      </section>
    </form>
  );
};

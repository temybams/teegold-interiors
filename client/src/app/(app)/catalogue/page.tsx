'use client';

import { useCallback, useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { TableSkeleton } from '@/components/loader';
import { apiFetch, apiPatch, apiPost, isApiRequestError, type ApiIssue } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatNaira } from '@/lib/money';
import { PRODUCT_CATEGORIES, PRICING_TYPE_LABELS, PRICING_TYPES } from '@/lib/pricing';
import {
  productResponseSchema,
  productsResponseSchema,
  type Product,
} from '@/lib/schemas';

const emptyForm = {
  name: '',
  category: 'Window Blinds',
  pricingType: 'PER_M2',
  unitPrice: '',
};

type FormState = typeof emptyForm;

const issueFor = (issues: ApiIssue[], field: string): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const CataloguePage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { products: list } = productsResponseSchema.parse(
        await apiFetch<unknown>('/api/products'),
      );
      setProducts(list);
      setListError(null);
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category;
    const haystack = `${product.name} ${product.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  });

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      pricingType: product.pricingType,
      unitPrice: String(product.unitPrice),
    });
    setIssues([]);
    setFormError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIssues([]);
    setFormError(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setIssues([]);
    setFormError(null);

    const body = {
      name: form.name,
      category: form.category,
      pricingType: form.pricingType,
      unitPrice: Number(form.unitPrice),
    };

    try {
      if (editingId) {
        productResponseSchema.parse(await apiPatch<unknown>(`/api/products/${editingId}`, body));
      } else {
        productResponseSchema.parse(await apiPost<unknown>('/api/products', body));
      }

      resetForm();
      await load();
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

  const setActive = async (product: Product, active: boolean) => {
    setBusyId(product.id);
    setListError(null);

    try {
      productResponseSchema.parse(
        await apiPatch<unknown>(`/api/products/${product.id}/status`, { active }),
      );
      setPendingDisable(null);
      await load();
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <main className="px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-3xl">Catalogue</h1>
        <p className="mt-3 text-sm text-muted">Only an admin can edit the catalogue.</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-serif text-3xl">Catalogue</h1>
        <p className="mt-1 text-sm text-muted">
          These products appear on invoices. Disable one instead of deleting it, so old invoices
          keep their names and prices.
        </p>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface p-4 sm:p-6">
        <h2 className="text-xs tracking-widest text-muted uppercase">
          {editingId ? 'Edit product' : 'Add product'}
        </h2>

        <form onSubmit={save} className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-sm">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'name') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'name') && (
              <span className="mt-1 block text-xs text-cancelled">{issueFor(issues, 'name')}</span>
            )}
          </label>

          <label className="block">
            <span className="text-sm">Category</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Pricing</span>
            <select
              value={form.pricingType}
              onChange={(event) =>
                setForm((current) => ({ ...current, pricingType: event.target.value }))
              }
              className="rounded-card mt-1 w-full border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {PRICING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PRICING_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Unit price</span>
            <input
              value={form.unitPrice}
              onChange={(event) =>
                setForm((current) => ({ ...current, unitPrice: event.target.value }))
              }
              inputMode="numeric"
              className={`rounded-card tabular mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'unitPrice') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'unitPrice') && (
              <span className="mt-1 block text-xs text-cancelled">
                {issueFor(issues, 'unitPrice')}
              </span>
            )}
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-card h-[2.6rem] w-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="mb-2 text-sm text-muted">
                Cancel
              </button>
            )}
          </div>
        </form>

        {formError && <p className="mt-4 text-sm text-cancelled">{formError}</p>}
      </section>

      <section className="rounded-card mt-6 overflow-x-auto border border-hairline bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-6 py-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="rounded-card w-full max-w-xs border border-hairline px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex flex-wrap gap-2">
            {['All', ...PRODUCT_CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-card px-3 py-1.5 text-xs ${
                  category === item ? 'bg-lilac text-brand' : 'border border-hairline text-muted'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {listError && <p className="px-6 py-4 text-sm text-cancelled">{listError}</p>}
        {loading && <TableSkeleton rows={6} columns={5} />}

        {!loading && visible.length === 0 && (
          <p className="px-6 py-8 text-sm text-muted">No products match that search.</p>
        )}

        {!loading && visible.length > 0 && (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-widest text-muted uppercase">
                <th className="px-6 py-3 font-normal">Product</th>
                <th className="px-6 py-3 font-normal">Category</th>
                <th className="px-6 py-3 font-normal">Pricing</th>
                <th className="px-6 py-3 font-normal">Unit price</th>
                <th className="px-6 py-3 font-normal">Status</th>
                <th className="px-6 py-3 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id} className={`border-t border-hairline ${product.active ? '' : 'text-muted'}`}>
                  <td className="px-6 py-3">{product.name}</td>
                  <td className="px-6 py-3">{product.category}</td>
                  <td className="px-6 py-3">{PRICING_TYPE_LABELS[product.pricingType]}</td>
                  <td className="tabular px-6 py-3">{formatNaira(product.unitPrice)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-card border px-2 py-0.5 text-xs font-medium ${
                        product.active
                          ? 'border-paid/30 bg-paid/10 text-paid'
                          : 'border-hairline text-muted'
                      }`}
                    >
                      {product.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="text-xs text-brand underline underline-offset-4"
                      >
                        Edit
                      </button>
                      {product.active ? (
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() => setPendingDisable(product)}
                          className="text-xs text-cancelled underline underline-offset-4 disabled:opacity-50"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() => void setActive(product, true)}
                          className="text-xs text-brand underline underline-offset-4 disabled:opacity-50"
                        >
                          Enable
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {pendingDisable && (
        <ConfirmDialog
          title={`Disable ${pendingDisable.name}?`}
          body="It will leave the invoice picker. Old invoices keep the name and price they already have."
          confirmLabel="Disable"
          danger
          busy={busyId === pendingDisable.id}
          onCancel={() => setPendingDisable(null)}
          onConfirm={() => void setActive(pendingDisable, false)}
        />
      )}
    </main>
  );
};

export default CataloguePage;

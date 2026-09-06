'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { InlineLoader } from '@/components/loader';
import { apiFetch, apiPatch, apiPost, isApiRequestError, type ApiIssue } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { business } from '@/lib/business';
import {
  categoriesResponseSchema,
  categoryResponseSchema,
  companyResponseSchema,
  type Category,
  type Company,
} from '@/lib/schemas';

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const issueFor = (issues: ApiIssue[], field: string): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

const emptyCompanyForm: {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
} = {
  name: business.name,
  tagline: business.tagline,
  phone: business.phone,
  email: business.email,
  address: business.address,
  bankName: business.bank.bankName,
  accountName: business.bank.accountName,
  accountNumber: business.bank.accountNumber,
};

const toForm = (company: Company) => ({
  name: company.name,
  tagline: company.tagline,
  phone: company.phone,
  email: company.email,
  address: company.address,
  bankName: company.bank.bankName,
  accountName: company.bank.accountName,
  accountNumber: company.bank.accountNumber,
});

const SettingsPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyCompanyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [companyResult, categoryResult] = await Promise.all([
        companyResponseSchema.parse(await apiFetch<unknown>('/api/settings')),
        categoriesResponseSchema.parse(await apiFetch<unknown>('/api/categories')),
      ]);
      setForm(toForm(companyResult.company));
      setCategories(categoryResult.categories);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeNames = useMemo(
    () => categories.filter((item) => item.active).map((item) => item.name),
    [categories],
  );

  const saveCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setIssues([]);
    setSaved(false);
    setError(null);

    try {
      const { company } = companyResponseSchema.parse(
        await apiPatch<unknown>('/api/settings', form),
      );
      setForm(toForm(company));
      setSaved(true);
    } catch (caught) {
      if (isApiRequestError(caught)) {
        setIssues(caught.issues);
        setError(caught.issues.length > 0 ? null : caught.message);
      } else {
        setError(errorMessage(caught));
      }
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setCategoryBusy(true);
    setError(null);

    try {
      const { category } = categoryResponseSchema.parse(
        await apiPost<unknown>('/api/categories', { name: newCategory }),
      );
      setCategories((current) => [...current, category].sort((a, b) => a.sortOrder - b.sortOrder));
      setNewCategory('');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCategoryBusy(false);
    }
  };

  const setCategoryActive = async (category: Category, active: boolean) => {
    setCategoryBusy(true);
    setError(null);

    try {
      const { category: next } = categoryResponseSchema.parse(
        await apiPatch<unknown>(`/api/categories/${category.id}`, { active }),
      );
      setCategories((current) => current.map((item) => (item.id === next.id ? next : item)));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCategoryBusy(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <main className="px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-3 text-sm text-muted">Only an admin can change company settings.</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Company details appear on invoices, receipts and the public share page.
        </p>
      </header>

      {loading && <InlineLoader label="Loading settings" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {!loading && (
        <>
          <form
            onSubmit={saveCompany}
            className="rounded-card mt-8 grid max-w-3xl gap-4 border border-hairline bg-surface p-4 sm:p-6"
          >
            <h2 className="text-xs tracking-widest text-muted uppercase">Company</h2>

            {(
              [
                ['name', 'Business name'],
                ['tagline', 'Tagline'],
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['address', 'Address'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm">{label}</span>
                <input
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                    issueFor(issues, key) ? 'border-cancelled' : 'border-hairline'
                  }`}
                />
                {issueFor(issues, key) && (
                  <span className="mt-1 block text-xs text-cancelled">{issueFor(issues, key)}</span>
                )}
              </label>
            ))}

            <h2 className="mt-4 text-xs tracking-widest text-muted uppercase">Bank details</h2>
            {(
              [
                ['bankName', 'Bank name'],
                ['accountName', 'Account name'],
                ['accountNumber', 'Account number'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm">{label}</span>
                <input
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                    issueFor(issues, key) ? 'border-cancelled' : 'border-hairline'
                  }`}
                />
                {issueFor(issues, key) && (
                  <span className="mt-1 block text-xs text-cancelled">{issueFor(issues, key)}</span>
                )}
              </label>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-card bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save settings'}
              </button>
              {saved && <p className="text-sm text-paid">Saved.</p>}
            </div>
          </form>

          <section className="rounded-card mt-8 max-w-3xl border border-hairline bg-surface p-4 sm:p-6">
            <h2 className="text-xs tracking-widest text-muted uppercase">Product categories</h2>
            <p className="mt-1 text-sm text-muted">
              Active categories ({activeNames.length}) appear in the catalogue picker.
            </p>

            <form onSubmit={addCategory} className="mt-4 flex flex-wrap gap-2">
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="New category"
                className="rounded-card min-w-[12rem] flex-1 border border-hairline px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={categoryBusy || !newCategory.trim()}
                className="rounded-card border border-hairline px-4 py-2.5 text-sm disabled:opacity-60"
              >
                Add
              </button>
            </form>

            <ul className="mt-4 divide-y divide-hairline">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted">{category.active ? 'Active' : 'Disabled'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={categoryBusy}
                    onClick={() => void setCategoryActive(category, !category.active)}
                    className="text-sm text-brand underline underline-offset-4 disabled:opacity-60"
                  >
                    {category.active ? 'Disable' : 'Enable'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
};

export default SettingsPage;

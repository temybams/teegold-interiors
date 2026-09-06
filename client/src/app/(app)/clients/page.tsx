'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { TableSkeleton } from '@/components/loader';
import { SearchField } from '@/components/search-field';
import { apiFetch, apiPatch, apiPost, isApiRequestError, type ApiIssue } from '@/lib/api';
import { formatNaira } from '@/lib/money';
import {
  customerResponseSchema,
  customersResponseSchema,
  type Customer,
} from '@/lib/schemas';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
};

type FormState = typeof emptyForm;

const issueFor = (issues: ApiIssue[], field: string): string | undefined =>
  issues.find((issue) => issue.field === field)?.message;

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const ClientsPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (search?: string) => {
    try {
      const path = search?.trim()
        ? `/api/customers?q=${encodeURIComponent(search.trim())}`
        : '/api/customers';
      const { customers: list } = customersResponseSchema.parse(await apiFetch<unknown>(path));
      setCustomers(list);
      setListError(null);
    } catch (caught) {
      setListError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(
      () => {
        void load(query);
      },
      query ? 250 : 0,
    );

    return () => window.clearTimeout(handle);
  }, [query, load]);

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({ name: customer.name, phone: customer.phone, address: customer.address });
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

    try {
      if (editingId) {
        customerResponseSchema.parse(await apiPatch<unknown>(`/api/customers/${editingId}`, form));
      } else {
        customerResponseSchema.parse(await apiPost<unknown>('/api/customers', form));
      }

      resetForm();
      await load(query);
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

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-serif text-3xl">Clients</h1>
        <p className="mt-1 text-sm text-muted">
          Search by name or phone. Invoice count and spend exclude cancelled invoices.
        </p>
      </header>

      <section className="rounded-card mt-8 border border-hairline bg-surface p-4 sm:p-6">
        <h2 className="text-xs tracking-widest text-muted uppercase">
          {editingId ? 'Edit client' : 'New client'}
        </h2>

        <form onSubmit={save} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
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
            <span className="text-sm">Phone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="0803 000 0000"
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'phone') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'phone') && (
              <span className="mt-1 block text-xs text-cancelled">{issueFor(issues, 'phone')}</span>
            )}
          </label>

          <label className="block">
            <span className="text-sm">Address</span>
            <input
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="GRA, Ado-Ekiti"
              className={`rounded-card mt-1 w-full border px-3 py-2.5 text-sm outline-none focus:border-brand ${
                issueFor(issues, 'address') ? 'border-cancelled' : 'border-hairline'
              }`}
            />
            {issueFor(issues, 'address') && (
              <span className="mt-1 block text-xs text-cancelled">
                {issueFor(issues, 'address')}
              </span>
            )}
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-card h-[2.6rem] w-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add client'}
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

      <section className="rounded-card mt-6 border border-hairline bg-surface">
        <div className="border-b border-hairline px-4 py-4 sm:px-6">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by name or phone"
          />
        </div>

        {listError && <p className="px-4 py-4 text-sm text-cancelled sm:px-6">{listError}</p>}
        {loading && <TableSkeleton rows={5} columns={5} />}

        {!loading && customers.length === 0 && (
          <p className="px-4 py-8 text-sm text-muted sm:px-6">
            {query.trim() ? 'No client matches that search.' : 'No clients yet. Add the first one above.'}
          </p>
        )}

        {!loading && customers.length > 0 && (
          <>
            <ul className="divide-y divide-hairline md:hidden">
              {customers.map((customer) => (
                <li key={customer.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/clients/${customer.id}`}
                        className="font-medium text-brand underline underline-offset-4"
                      >
                        {customer.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{customer.phone}</p>
                      <p className="mt-0.5 text-sm">{customer.address}</p>
                      <p className="tabular mt-2 text-xs text-muted">
                        {customer.invoiceCount} invoices · {formatNaira(customer.totalSpent)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(customer)}
                      className="shrink-0 text-xs text-brand underline underline-offset-4"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-widest text-muted uppercase">
                    <th className="px-6 py-3 font-normal">Client</th>
                    <th className="px-6 py-3 font-normal">Phone</th>
                    <th className="px-6 py-3 font-normal">Location</th>
                    <th className="px-6 py-3 font-normal">Invoices</th>
                    <th className="px-6 py-3 font-normal">Total spent</th>
                    <th className="px-6 py-3 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-hairline">
                      <td className="px-6 py-3">
                        <Link
                          href={`/clients/${customer.id}`}
                          className="text-brand underline underline-offset-4"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted">{customer.phone}</td>
                      <td className="px-6 py-3">{customer.address}</td>
                      <td className="tabular px-6 py-3">{customer.invoiceCount}</td>
                      <td className="tabular px-6 py-3">{formatNaira(customer.totalSpent)}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(customer)}
                          className="text-xs text-brand underline underline-offset-4"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default ClientsPage;

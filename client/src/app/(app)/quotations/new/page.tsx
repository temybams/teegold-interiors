'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InvoiceForm } from '@/components/invoice-form';
import { InlineLoader } from '@/components/loader';
import { apiFetch, isApiRequestError } from '@/lib/api';
import { customersResponseSchema, productsResponseSchema, type Customer, type Product } from '@/lib/schemas';

const today = () =>
  new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const errorMessage = (caught: unknown): string =>
  isApiRequestError(caught) ? caught.message : 'Could not reach the server. Is it running?';

const NewQuotationPage = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [customerResult, productResult] = await Promise.all([
          customersResponseSchema.parse(await apiFetch<unknown>('/api/customers')),
          productsResponseSchema.parse(await apiFetch<unknown>('/api/products?active=true')),
        ]);

        if (!cancelled) {
          setCustomers(customerResult.customers);
          setProducts(productResult.products);
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
  }, []);

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <header>
        <p className="text-xs">
          <Link href="/quotations" className="text-brand underline underline-offset-4">
            Quotations
          </Link>
        </p>
        <h1 className="mt-2 font-serif text-3xl">New quotation</h1>
        <p className="mt-1 text-sm text-muted">
          {today()} · number assigned on save, date freezes then.
        </p>
      </header>

      {loading && <InlineLoader label="Loading catalogue" />}
      {error && <p className="mt-6 text-sm text-cancelled">{error}</p>}

      {!loading && !error && (
        <div className="mt-8">
          <InvoiceForm
            mode="create"
            kind="quotation"
            customers={customers}
            products={products}
            onSaved={(document) => router.replace(`/quotations/${document.id}`)}
          />
        </div>
      )}
    </main>
  );
};

export default NewQuotationPage;

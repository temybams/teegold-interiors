import {
  calculateArea,
  calculateLineTotal,
  calculateTotals,
  formatNaira,
  PRICING_TYPE_LABELS,
} from '@teegold/shared';

import { ApiStatus } from '@/components/api-status';
import { Wordmark } from '@/components/wordmark';

const wired = [
  'Yarn workspaces monorepo — apps/web, apps/api, packages/shared',
  'TypeScript in strict mode everywhere, with a shared base config',
  'Express API with helmet, CORS, request logging and a /health route',
  'Zod-validated environment variables on the API',
  'Tailwind carrying the locked indigo design tokens',
  'Postgres via docker compose, ready for Prisma in Stage 2',
  'ESLint and Prettier across the whole repo',
];

const palette = [
  { name: 'Canvas', hex: '#FAFAFF', className: 'bg-canvas' },
  { name: 'Ink', hex: '#16162B', className: 'bg-ink' },
  { name: 'Indigo', hex: '#4F46E5', className: 'bg-brand' },
  { name: 'Deep indigo', hex: '#1E1B3A', className: 'bg-brand-deep' },
  { name: 'Lilac', hex: '#EDEBFE', className: 'bg-lilac' },
  { name: 'Paid', hex: '#067647', className: 'bg-paid' },
  { name: 'Pending', hex: '#B4690E', className: 'bg-pending' },
  { name: 'Cancelled', hex: '#B42318', className: 'bg-cancelled' },
];

// The measurement rule the whole invoice depends on, computed by @teegold/shared.
const sampleLine = {
  product: 'Zebra Blind',
  pricingType: 'PER_M2' as const,
  width: 1.0,
  height: 2.0,
  unitPrice: 25_000,
};

const area = calculateArea(sampleLine.width, sampleLine.height);
const lineTotal = calculateLineTotal(sampleLine);
const totals = calculateTotals({ lineTotals: [lineTotal], discount: 0 });

const HomePage = () => (
  <main className="mx-auto max-w-5xl px-6 py-14">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
      <Wordmark />
      <span className="rounded-card bg-lilac px-2.5 py-1 text-xs font-medium tracking-[0.12em] text-brand uppercase">
        Stage 1 · Foundation
      </span>
    </header>

    <section className="mt-12">
      <h1 className="font-serif text-4xl leading-tight">The foundation is up</h1>
      <p className="mt-3 max-w-2xl text-muted">
        No features yet — this page exists to prove the monorepo, the API and the design tokens are
        wired together. Authentication lands in Stage 2.
      </p>
    </section>

    <section className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="rounded-card border border-hairline bg-surface p-6">
        <h2 className="text-xs tracking-[0.12em] text-muted uppercase">What is wired</h2>
        <ul className="mt-4 space-y-3">
          {wired.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden className="mt-0.5 text-brand">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-6">
        <ApiStatus />

        <div className="rounded-card border border-hairline bg-surface p-6">
          <h2 className="text-xs tracking-[0.12em] text-muted uppercase">
            Measurement rule (from shared)
          </h2>
          <p className="mt-2 text-sm text-muted">
            {sampleLine.product} · {PRICING_TYPE_LABELS[sampleLine.pricingType]}
          </p>

          <div className="rounded-card mt-4 bg-lilac px-4 py-3">
            <p className="text-xs tracking-[0.12em] text-brand uppercase">Area</p>
            <p className="tabular mt-1 text-2xl font-semibold">
              {area.toFixed(2)} m<sup>2</sup>
            </p>
            <p className="mt-1 text-xs text-muted">
              {sampleLine.width.toFixed(1)} m × {sampleLine.height.toFixed(1)} m
            </p>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Price per m²</dt>
              <dd className="tabular">{formatNaira(sampleLine.unitPrice)}</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-2">
              <dt className="text-muted">Line total</dt>
              <dd className="tabular font-semibold">{formatNaira(totals.total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <section className="mt-10">
      <h2 className="text-xs tracking-[0.12em] text-muted uppercase">Design tokens</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {palette.map((swatch) => (
          <div key={swatch.name} className="rounded-card border border-hairline bg-surface p-3">
            <div className={`rounded-card h-12 border border-hairline ${swatch.className}`} />
            <p className="mt-2 text-sm">{swatch.name}</p>
            <p className="tabular text-xs text-muted">{swatch.hex}</p>
          </div>
        ))}
      </div>
    </section>

    <footer className="mt-14 border-t border-hairline pt-6 text-sm text-muted">
      Teegold Interiors · GRA, Ado-Ekiti
    </footer>
  </main>
);

export default HomePage;

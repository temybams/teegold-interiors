import { InvoiceStatus } from '@/components/invoice-status';
import { Wordmark } from '@/components/wordmark';
import { business } from '@/lib/business';
import { formatInvoiceDate, formatLineQuantity, formatMeasurement } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import type { InvoiceItem, InvoiceSummary } from '@/lib/schemas';

type InvoiceDocumentProps = {
  invoice: InvoiceSummary & { items: InvoiceItem[] };
};

export const InvoiceDocument = ({ invoice }: InvoiceDocumentProps) => (
  <article className="invoice-sheet mx-auto w-full max-w-[720px] bg-white text-ink">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Wordmark
          markClassName="size-9 shrink-0 text-brand"
          textClassName="font-serif text-base tracking-[0.18em] uppercase sm:text-lg sm:tracking-[0.2em]"
        />
        <p className="mt-3 text-sm text-muted">{business.tagline}</p>
        <p className="mt-1 text-sm text-muted">
          {business.address} · {business.phone}
        </p>
      </div>
      <div className="text-right">
        <p className="font-serif text-3xl">Invoice</p>
        <div className="mt-2 flex justify-end">
          <InvoiceStatus invoice={invoice} />
        </div>
      </div>
    </header>

    <section className="mt-10 grid gap-8 sm:grid-cols-2">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Billed to</p>
        <p className="mt-2 font-medium">{invoice.customer.name}</p>
        <p className="mt-1 text-sm text-muted">{invoice.customer.phone}</p>
        <p className="mt-1 text-sm text-muted">{invoice.customer.address}</p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Invoice</p>
        <p className="mt-2 font-medium">{invoice.number}</p>
        <p className="mt-1 text-sm text-muted">{formatInvoiceDate(invoice.createdAt)}</p>
      </div>
    </section>

    <div className="mt-10 hidden sm:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand text-left text-xs tracking-widest text-brand uppercase">
            <th className="py-2 pr-3 font-medium">Item</th>
            <th className="py-2 pr-3 font-medium">Measurement</th>
            <th className="py-2 pr-3 font-medium">Qty</th>
            <th className="py-2 pr-3 font-medium">Unit price</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-hairline">
              <td className="py-3 pr-3">{item.nameSnapshot}</td>
              <td className="py-3 pr-3 text-muted">{formatMeasurement(item)}</td>
              <td className="tabular py-3 pr-3">{formatLineQuantity(item)}</td>
              <td className="tabular py-3 pr-3">{formatNaira(item.unitPrice)}</td>
              <td className="tabular py-3 text-right">{formatNaira(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ul className="mt-10 divide-y divide-hairline border-y border-hairline sm:hidden">
      {invoice.items.map((item) => (
        <li key={item.id} className="py-3">
          <p className="font-medium">{item.nameSnapshot}</p>
          <p className="mt-1 text-xs text-muted">
            {formatMeasurement(item)} · {formatLineQuantity(item)}
          </p>
          <p className="tabular mt-1 text-sm">
            {formatNaira(item.unitPrice)} → {formatNaira(item.lineTotal)}
          </p>
        </li>
      ))}
    </ul>

    <section className="mt-8 ml-auto w-full max-w-xs space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted">Subtotal</span>
        <span className="tabular">{formatNaira(invoice.subtotal)}</span>
      </div>
      {invoice.discount > 0 && (
        <div className="flex justify-between">
          <span className="text-muted">Discount</span>
          <span className="tabular">{formatNaira(invoice.discount)}</span>
        </div>
      )}
      <div className="invoice-total flex items-end justify-between bg-lilac px-4 py-3">
        <span className="text-xs tracking-[0.16em] text-brand uppercase">Total</span>
        <span className="tabular font-serif text-3xl">{formatNaira(invoice.total)}</span>
      </div>
      {(invoice.amountPaid > 0 || invoice.balance > 0) && (
        <>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Paid</span>
            <span className="tabular">{formatNaira(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Balance</span>
            <span className="tabular">{formatNaira(invoice.balance)}</span>
          </div>
        </>
      )}
    </section>

    <footer className="mt-14 text-xs text-muted">
      <p>Thank you for your custom.</p>
      <p className="mt-1">
        {business.email} · {business.phone}
      </p>
    </footer>
  </article>
);

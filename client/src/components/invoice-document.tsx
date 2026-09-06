import { InvoiceStatus } from '@/components/invoice-status';
import { QuotationStatus } from '@/components/quotation-status';
import { Monogram, Wordmark } from '@/components/wordmark';
import { business } from '@/lib/business';
import { formatInvoiceDate, formatLineQuantity, formatMeasurement } from '@/lib/invoice';
import { formatNaira } from '@/lib/money';
import type {
  Company,
  InvoiceItem,
  InvoiceSummary,
  QuotationSummary,
} from '@/lib/schemas';

export type DocumentVariant = 'invoice' | 'receipt' | 'quotation';

type DocumentBase = {
  number: string;
  customer: InvoiceSummary['customer'];
  createdBy?: InvoiceSummary['createdBy'];
  discount: number;
  subtotal: number;
  total: number;
  amountPaid?: number;
  balance?: number;
  paymentStatus?: InvoiceSummary['paymentStatus'];
  status?: QuotationSummary['status'];
  cancelledAt: string | null;
  createdAt: string;
  items: InvoiceItem[];
};

type InvoiceDocumentProps = {
  invoice: DocumentBase;
  variant?: DocumentVariant;
  company?: Company;
};

const needsPayment = (invoice: DocumentBase): boolean =>
  !invoice.cancelledAt && invoice.paymentStatus !== 'PAID';

export const InvoiceDocument = ({
  invoice,
  variant = 'invoice',
  company,
}: InvoiceDocumentProps) => {
  const profile = company ?? {
    name: business.name,
    tagline: business.tagline,
    phone: business.phone,
    email: business.email,
    address: business.address,
    bank: business.bank,
  };
  const isQuotation = variant === 'quotation';
  const isReceipt =
    !isQuotation && (variant === 'receipt' || invoice.paymentStatus === 'PAID');
  const title = isQuotation ? 'Quotation' : isReceipt ? 'Receipt' : 'Invoice';
  const showBank = !isQuotation && !isReceipt && needsPayment(invoice);
  const amountPaid = invoice.amountPaid ?? 0;
  const balance = invoice.balance ?? invoice.total;

  return (
    <article className="invoice-sheet relative mx-auto w-full max-w-[720px] overflow-hidden bg-white text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
      >
        <Monogram className="size-64 text-brand" />
      </div>

      <div className="relative">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Wordmark
              markClassName="size-9 shrink-0 text-brand"
              textClassName="font-serif text-base tracking-[0.18em] uppercase sm:text-lg sm:tracking-[0.2em]"
            />
            <p className="mt-3 text-sm text-muted">{profile.tagline}</p>
            <p className="mt-1 text-sm text-muted">
              {profile.address} · {profile.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-3xl">{title}</p>
            <div className="mt-2 flex justify-end">
              {isQuotation && invoice.status ? (
                <QuotationStatus quotation={{ status: invoice.status, cancelledAt: invoice.cancelledAt }} />
              ) : invoice.paymentStatus ? (
                <InvoiceStatus
                  invoice={{ paymentStatus: invoice.paymentStatus, cancelledAt: invoice.cancelledAt }}
                />
              ) : null}
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
            <p className="text-xs tracking-[0.16em] text-muted uppercase">
              {isQuotation ? 'Quotation' : isReceipt ? 'Receipt for' : 'Invoice'}
            </p>
            <p className="mt-2 font-medium">{invoice.number}</p>
            <p className="mt-1 text-sm text-muted">{formatInvoiceDate(invoice.createdAt)}</p>
            {invoice.createdBy && (
              <p className="mt-1 text-sm text-muted">Raised by {invoice.createdBy.name}</p>
            )}
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
            <span className="text-xs tracking-[0.16em] text-brand uppercase">
              {isReceipt ? 'Amount paid' : 'Total'}
            </span>
            <span className="tabular font-serif text-3xl">
              {formatNaira(isReceipt ? amountPaid || invoice.total : invoice.total)}
            </span>
          </div>
          {!isQuotation && !isReceipt && (amountPaid > 0 || balance > 0) && (
            <>
              <div className="flex justify-between pt-1">
                <span className="text-muted">Paid</span>
                <span className="tabular">{formatNaira(amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Balance</span>
                <span className="tabular">{formatNaira(balance)}</span>
              </div>
            </>
          )}
          {isReceipt && (
            <p className="pt-1 text-xs text-paid">Payment received in full. Balance ₦0.</p>
          )}
        </section>

        {showBank && (
          <section className="mt-10 max-w-sm border-t border-hairline pt-6">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Pay into</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Bank</dt>
                <dd>{profile.bank.bankName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Account name</dt>
                <dd className="text-right">{profile.bank.accountName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Account number</dt>
                <dd className="tabular font-medium">{profile.bank.accountNumber}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">
              Use {invoice.number} as the transfer reference.
            </p>
          </section>
        )}

        <footer className="mt-14 text-xs text-muted">
          <p>
            {isQuotation
              ? 'This quotation is valid subject to confirmation.'
              : isReceipt
                ? 'Thank you for your payment.'
                : 'Thank you for your custom.'}
          </p>
          <p className="mt-1">
            {profile.email} · {profile.phone}
          </p>
        </footer>
      </div>
    </article>
  );
};

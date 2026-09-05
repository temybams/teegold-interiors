import { invoiceStatusLabel, invoiceTone, statusChipClass } from '@/lib/invoice';
import type { InvoiceSummary } from '@/lib/schemas';

export const InvoiceStatus = ({
  invoice,
}: {
  invoice: Pick<InvoiceSummary, 'paymentStatus' | 'cancelledAt'>;
}) => (
  <span
    className={`rounded-card border px-2 py-0.5 text-xs font-medium ${statusChipClass[invoiceTone(invoice)]}`}
  >
    {invoiceStatusLabel(invoice)}
  </span>
);

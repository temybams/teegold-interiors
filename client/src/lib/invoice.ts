import type { InvoiceItem, InvoiceSummary, PaymentStatus } from './schemas';

export const formatInvoiceDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatMeasurement = (item: Pick<InvoiceItem, 'width' | 'height'>): string =>
  item.width != null && item.height != null
    ? `${item.width.toFixed(1)} × ${item.height.toFixed(1)} m`
    : '—';

export const formatLineQuantity = (item: Pick<InvoiceItem, 'pricingType' | 'quantity'>): string =>
  item.pricingType === 'PER_M2' ? `${item.quantity.toFixed(2)} m²` : String(item.quantity);

export type InvoiceTone = 'paid' | 'pending' | 'cancelled';

export const invoiceTone = (invoice: Pick<InvoiceSummary, 'paymentStatus' | 'cancelledAt'>): InvoiceTone => {
  if (invoice.cancelledAt) {
    return 'cancelled';
  }

  return invoice.paymentStatus === 'PAID' ? 'paid' : 'pending';
};

export const invoiceStatusLabel = (
  invoice: Pick<InvoiceSummary, 'paymentStatus' | 'cancelledAt'>,
): string => {
  if (invoice.cancelledAt) {
    return 'Cancelled';
  }

  const labels: Record<PaymentStatus, string> = {
    PAID: 'Paid',
    PARTIAL: 'Partial',
    UNPAID: 'Unpaid',
  };

  return labels[invoice.paymentStatus];
};

export const statusChipClass: Record<InvoiceTone, string> = {
  paid: 'border-paid/30 bg-paid/10 text-paid',
  pending: 'border-pending/30 bg-pending/10 text-pending',
  cancelled: 'border-cancelled/30 bg-cancelled/10 text-cancelled',
};

export const publicInvoicePath = (token: string): string => `/i/${token}`;

export const invoiceShareText = (input: {
  customerName: string;
  number: string;
  totalFormatted: string;
  url: string;
}): string => {
  const first = input.customerName.split(/\s+/)[0] ?? input.customerName;
  return `Hello ${first}, please find your Teegold Interiors invoice ${input.number}. Total: ${input.totalFormatted}. ${input.url}`;
};

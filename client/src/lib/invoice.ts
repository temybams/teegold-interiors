import type {
  InvoiceItem,
  InvoiceSummary,
  JobStatus,
  PaymentStatus,
  QuotationStatus,
  QuotationSummary,
} from './schemas';

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

export type QuotationTone = 'open' | 'converted' | 'cancelled';

export const quotationTone = (
  quotation: Pick<QuotationSummary, 'status' | 'cancelledAt'>,
): QuotationTone => {
  if (quotation.cancelledAt || quotation.status === 'CANCELLED') {
    return 'cancelled';
  }

  return quotation.status === 'CONVERTED' ? 'converted' : 'open';
};

export const quotationStatusLabel = (
  quotation: Pick<QuotationSummary, 'status' | 'cancelledAt'>,
): string => {
  if (quotation.cancelledAt || quotation.status === 'CANCELLED') {
    return 'Cancelled';
  }

  const labels: Record<QuotationStatus, string> = {
    OPEN: 'Open',
    CONVERTED: 'Converted',
    CANCELLED: 'Cancelled',
  };

  return labels[quotation.status];
};

export const jobStatusLabel = (status: JobStatus): string => {
  const labels: Record<JobStatus, string> = {
    NOT_STARTED: 'Not started',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
  };

  return labels[status];
};

export const statusChipClass: Record<InvoiceTone | QuotationTone, string> = {
  paid: 'border-paid/30 bg-paid/10 text-paid',
  pending: 'border-pending/30 bg-pending/10 text-pending',
  cancelled: 'border-cancelled/30 bg-cancelled/10 text-cancelled',
  open: 'border-pending/30 bg-pending/10 text-pending',
  converted: 'border-paid/30 bg-paid/10 text-paid',
};

export const publicInvoicePath = (token: string): string => `/i/${token}`;

export const publicQuotationPath = (token: string): string => `/q/${token}`;

export const invoiceShareText = (input: {
  customerName: string;
  number: string;
  totalFormatted: string;
  url: string;
}): string =>
  `Hello ${input.customerName}, please find your Teegold Interiors invoice ${input.number}. Total: ${input.totalFormatted}. ${input.url}`;

export const receiptShareText = (input: {
  customerName: string;
  number: string;
  amountPaidFormatted: string;
  url: string;
}): string =>
  `Hello ${input.customerName}, here is your Teegold Interiors receipt for ${input.number}. Amount paid: ${input.amountPaidFormatted}. ${input.url}`;

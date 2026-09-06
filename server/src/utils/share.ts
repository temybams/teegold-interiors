import { formatNaira } from './money';

export const publicInvoiceUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/$/, '')}/i/${token}`;

export const publicQuotationUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/$/, '')}/q/${token}`;

export const invoiceShareText = (input: {
  customerName: string;
  number: string;
  total: number;
  url: string;
}): string =>
  `Hello ${input.customerName}, please find your Teegold Interiors invoice ${input.number}. Total: ${formatNaira(input.total)}. ${input.url}`;

export const quotationShareText = (input: {
  customerName: string;
  number: string;
  total: number;
  url: string;
}): string =>
  `Hello ${input.customerName}, please find your Teegold Interiors quotation ${input.number}. Total: ${formatNaira(input.total)}. ${input.url}`;

export const receiptShareText = (input: {
  customerName: string;
  number: string;
  amountPaid: number;
  url: string;
}): string =>
  `Hello ${input.customerName}, here is your Teegold Interiors receipt for ${input.number}. Amount paid: ${formatNaira(input.amountPaid)}. ${input.url}`;


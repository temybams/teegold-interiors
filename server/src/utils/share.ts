import { formatNaira } from './money';

export const publicInvoiceUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/$/, '')}/i/${token}`;

export const invoiceShareText = (input: {
  customerName: string;
  number: string;
  total: number;
  url: string;
}): string => {
  const first = input.customerName.split(/\s+/)[0] ?? input.customerName;
  return `Hello ${first}, please find your Teegold Interiors invoice ${input.number}. Total: ${formatNaira(input.total)}. ${input.url}`;
};

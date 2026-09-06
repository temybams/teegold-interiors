import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import type { PublicInvoice } from '../services/invoice.service';
import { getCompanySettings, type PublicCompany } from '../services/settings.service';

const ink = rgb(22 / 255, 22 / 255, 43 / 255);
const muted = rgb(107 / 255, 107 / 255, 128 / 255);
const brand = rgb(79 / 255, 70 / 255, 229 / 255);
const hairline = rgb(231 / 255, 231 / 255, 240 / 255);
const lilac = rgb(237 / 255, 235 / 255, 254 / 255);
const paid = rgb(6 / 255, 118 / 255, 71 / 255);

const naira = (amount: number): string => `NGN ${Math.round(amount).toLocaleString('en-NG')}`;

const measurement = (item: PublicInvoice['items'][number]): string =>
  item.width != null && item.height != null
    ? `${item.width.toFixed(1)} x ${item.height.toFixed(1)} m`
    : '—';

const quantity = (item: PublicInvoice['items'][number]): string =>
  item.pricingType === 'PER_M2' ? `${item.quantity.toFixed(2)} m2` : String(item.quantity);

const statusLabel = (invoice: PublicInvoice, variant: PdfVariant): string => {
  if (invoice.cancelledAt) {
    return 'Cancelled';
  }

  if (variant === 'quotation') {
    return 'Open';
  }

  if (invoice.paymentStatus === 'PAID') {
    return 'Paid';
  }

  if (invoice.paymentStatus === 'PARTIAL') {
    return 'Partial';
  }

  return 'Unpaid';
};

const dateLabel = (value: Date): string =>
  value.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

export type PdfVariant = 'invoice' | 'receipt' | 'quotation';

/**
 * A typeset A4 invoice, receipt or quotation — not a screenshot of the admin form.
 * Standard PDF fonts cannot draw ₦, so amounts use NGN.
 */
export const buildInvoicePdf = async (
  invoice: PublicInvoice,
  variant: PdfVariant = 'invoice',
  companyOverride?: PublicCompany,
): Promise<Buffer> => {
  const company = companyOverride ?? (await getCompanySettings());
  const isQuotation = variant === 'quotation';
  const isReceipt = !isQuotation && (variant === 'receipt' || invoice.paymentStatus === 'PAID');
  const showBank = !isQuotation && !isReceipt && !invoice.cancelledAt && invoice.paymentStatus !== 'PAID';
  const title = isQuotation ? 'QUOTATION' : isReceipt ? 'RECEIPT' : 'INVOICE';
  const showPaidBalance = !isQuotation && !isReceipt && (invoice.amountPaid > 0 || invoice.balance > 0);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const left = 48;
  const right = width - 48;
  let y = height - 56;

  const text = (
    value: string,
    x: number,
    at: number,
    size: number,
    font = sans,
    color = ink,
  ) => {
    page.drawText(value, { x, y: at, size, font, color });
  };

  page.drawText('TG', {
    x: width / 2 - 40,
    y: height / 2 - 20,
    size: 96,
    font: sansBold,
    color: rgb(0.9, 0.89, 0.98),
  });

  text(company.name.toUpperCase(), left, y, 14, sansBold, brand);
  y -= 16;
  text(company.tagline, left, y, 9, sans, muted);
  y -= 12;
  text(`${company.address}  ·  ${company.phone}`, left, y, 9, sans, muted);

  text(title, right - sansBold.widthOfTextAtSize(title, 16), height - 56, 16, sansBold);
  const status = statusLabel(invoice, variant).toUpperCase();
  text(
    status,
    right - sans.widthOfTextAtSize(status, 9),
    height - 74,
    9,
    sans,
    isReceipt ? paid : muted,
  );

  y -= 36;
  text('BILLED TO', left, y, 8, sansBold, muted);
  text(invoice.number, right - sansBold.widthOfTextAtSize(invoice.number, 11), y, 11, sansBold);
  y -= 14;
  text(invoice.customer.name, left, y, 11, sansBold);
  text(dateLabel(invoice.createdAt), right - sans.widthOfTextAtSize(dateLabel(invoice.createdAt), 10), y, 10, sans);
  y -= 13;
  text(invoice.customer.phone, left, y, 10, sans, muted);
  if (invoice.createdBy) {
    const raised = `Raised by ${invoice.createdBy.name}`;
    text(raised, right - sans.widthOfTextAtSize(raised, 9), y, 9, sans, muted);
  }
  y -= 13;
  text(invoice.customer.address, left, y, 10, sans, muted);

  y -= 28;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.8,
    color: brand,
  });

  y -= 16;
  const cols = { item: left, measure: left + 168, qty: left + 300, price: left + 380, total: right };
  text('ITEM', cols.item, y, 8, sansBold, brand);
  text('MEASUREMENT', cols.measure, y, 8, sansBold, brand);
  text('QTY', cols.qty, y, 8, sansBold, brand);
  text('UNIT PRICE', cols.price, y, 8, sansBold, brand);
  const totalHead = 'TOTAL';
  text(totalHead, cols.total - sansBold.widthOfTextAtSize(totalHead, 8), y, 8, sansBold, brand);

  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.4,
    color: hairline,
  });

  for (const item of invoice.items) {
    y -= 18;
    text(item.nameSnapshot.slice(0, 28), cols.item, y, 9, sans);
    text(measurement(item), cols.measure, y, 9, sans, muted);
    text(quantity(item), cols.qty, y, 9, sans);
    const price = naira(item.unitPrice);
    text(price, cols.price, y, 9, sans);
    const line = naira(item.lineTotal);
    text(line, cols.total - sans.widthOfTextAtSize(line, 9), y, 9, sans);
  }

  y -= 28;
  const row = (label: string, value: string, emphasis = false) => {
    const font = emphasis ? sansBold : sans;
    const size = emphasis ? 13 : 10;
    text(label, left + 280, y, size, font, emphasis ? ink : muted);
    text(value, right - font.widthOfTextAtSize(value, size), y, size, font);
    y -= emphasis ? 22 : 16;
  };

  row('Subtotal', naira(invoice.subtotal));
  if (invoice.discount > 0) {
    row('Discount', naira(invoice.discount));
  }

  page.drawRectangle({
    x: left + 260,
    y: y - 6,
    width: right - (left + 260),
    height: 26,
    color: lilac,
  });
  row(
    isReceipt ? 'AMOUNT PAID' : 'TOTAL',
    naira(isReceipt ? invoice.amountPaid || invoice.total : invoice.total),
    true,
  );

  if (showPaidBalance) {
    row('Paid', naira(invoice.amountPaid));
    row('Balance', naira(invoice.balance));
  }

  if (isReceipt) {
    text('Payment received in full.', left + 280, y, 9, sans, paid);
    y -= 16;
  }

  if (isQuotation) {
    text('This quotation is valid for 14 days.', left + 280, y, 9, sans, muted);
    y -= 16;
  }

  if (showBank) {
    y -= 10;
    text('PAY INTO', left, y, 8, sansBold, muted);
    y -= 14;
    text(`Bank: ${company.bank.bankName}`, left, y, 9, sans);
    y -= 12;
    text(`Account name: ${company.bank.accountName}`, left, y, 9, sans);
    y -= 12;
    text(`Account number: ${company.bank.accountNumber}`, left, y, 9, sansBold);
    y -= 12;
    text(`Reference: ${invoice.number}`, left, y, 9, sans, muted);
  }

  y = 64;
  page.drawLine({
    start: { x: left, y: y + 16 },
    end: { x: right, y: y + 16 },
    thickness: 0.3,
    color: hairline,
  });
  text(
    isQuotation
      ? 'Thank you for considering Teegold Interiors.'
      : isReceipt
        ? 'Thank you for your payment.'
        : 'Thank you for your custom.',
    left,
    y,
    9,
    sans,
    muted,
  );
  text(`${company.email}  ·  ${company.phone}`, left, y - 13, 8, sans, muted);

  return Buffer.from(await doc.save());
};

import type { RequestHandler, Response } from 'express';

import { env } from '../config/env';
import { invoiceEmail, sendMail } from '../lib/mail';
import { buildInvoicePdf, type PdfVariant } from '../lib/invoice-pdf';
import {
  cancelInvoice,
  createInvoice,
  getInvoice,
  getInvoiceByToken,
  listInvoices,
  listInvoicesForExport,
  recordPayment,
  updateInvoice,
} from '../services/invoice.service';
import { getCompanySettings } from '../services/settings.service';
import { asyncHandler } from '../utils/async-handler';
import { toCsv } from '../utils/csv';
import { formatNaira } from '../utils/money';
import { invoiceShareText, publicInvoiceUrl } from '../utils/share';
import type {
  InvoiceBody,
  InvoiceEmailBody,
  InvoiceListQuery,
  InvoicePaymentBody,
} from '../validations/invoice.validation';

const sendPdf = (res: Response, filename: string, pdf: Buffer) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
};

export const getInvoices: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as InvoiceListQuery;

  res.json(await listInvoices(query));
});

export const getInvoicesCsv: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as InvoiceListQuery;
  const invoices = await listInvoicesForExport(query);
  const csv = toCsv(
    ['Number', 'Client', 'Phone', 'Date', 'Total', 'Paid', 'Balance', 'Status'],
    invoices.map((invoice) => [
      invoice.number,
      invoice.customer.name,
      invoice.customer.phone,
      invoice.createdAt.toISOString().slice(0, 10),
      invoice.total,
      invoice.amountPaid,
      invoice.balance,
      invoice.cancelledAt ? 'Cancelled' : invoice.paymentStatus,
    ]),
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
  res.send(csv);
});

export const getInvoiceById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };

  res.json({ invoice: await getInvoice(id) });
});

export const postInvoice: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as InvoiceBody;

  res.status(201).json({ invoice: await createInvoice(body, req.user!.id) });
});

export const patchInvoice: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as InvoiceBody;

  res.json({ invoice: await updateInvoice(id, body, req.user!.role) });
});

export const patchInvoiceCancel: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };

  res.json({ invoice: await cancelInvoice(id, req.user!.role) });
});

export const patchInvoicePayment: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { payment } = req.body as InvoicePaymentBody;

  res.json({ invoice: await recordPayment(id, payment, req.user!.role) });
});

const pdfVariantFrom = (query: unknown): PdfVariant => {
  const value =
    typeof query === 'object' && query && 'variant' in query
      ? String((query as { variant?: string }).variant)
      : '';

  return value === 'receipt' ? 'receipt' : 'invoice';
};

export const getInvoicePdf: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const variant = pdfVariantFrom(req.query);
  const invoice = await getInvoice(id);
  const filename = variant === 'receipt' ? `${invoice.number}-receipt.pdf` : `${invoice.number}.pdf`;

  sendPdf(res, filename, await buildInvoicePdf(invoice, variant));
});

export const getPublicInvoice: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.params as { token: string };
  const [invoice, company] = await Promise.all([getInvoiceByToken(token), getCompanySettings()]);

  res.json({
    company,
    invoice: {
      id: invoice.id,
      number: invoice.number,
      customer: invoice.customer,
      createdBy: invoice.createdBy,
      discount: invoice.discount,
      subtotal: invoice.subtotal,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
      paymentStatus: invoice.paymentStatus,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      cancelledAt: invoice.cancelledAt,
      items: invoice.items,
    },
  });
});

export const getPublicInvoicePdf: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.params as { token: string };
  const variant = pdfVariantFrom(req.query);
  const invoice = await getInvoiceByToken(token);
  const filename = variant === 'receipt' ? `${invoice.number}-receipt.pdf` : `${invoice.number}.pdf`;

  sendPdf(res, filename, await buildInvoicePdf(invoice, variant));
});

export const postInvoiceEmail: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { email } = req.body as InvoiceEmailBody;
  const invoice = await getInvoice(id);
  const url = publicInvoiceUrl(env.CLIENT_ORIGIN, invoice.publicToken);
  const mail = invoiceEmail({
    customerName: invoice.customer.name,
    number: invoice.number,
    totalLabel: formatNaira(invoice.total),
    url,
  });
  const pdf = await buildInvoicePdf(invoice);
  const emailed = await sendMail({
    ...mail,
    to: email,
    attachments: [{ filename: `${invoice.number}.pdf`, content: pdf, contentType: 'application/pdf' }],
  });

  res.json({
    emailed,
    url,
    message: emailed
      ? `Sent ${invoice.number} to ${email}`
      : 'Email is not configured on this server. Copy the invoice link and send it yourself.',
  });
});

export const getInvoiceShare: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const invoice = await getInvoice(id);
  const url = publicInvoiceUrl(env.CLIENT_ORIGIN, invoice.publicToken);

  res.json({
    url,
    message: invoiceShareText({
      customerName: invoice.customer.name,
      number: invoice.number,
      total: invoice.total,
      url,
    }),
    phone: invoice.customer.phone,
  });
});

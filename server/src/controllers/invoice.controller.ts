import type { RequestHandler, Response } from 'express';

import { env } from '../config/env';
import { invoiceEmail, sendMail } from '../lib/mail';
import { buildInvoicePdf } from '../lib/invoice-pdf';
import {
  cancelInvoice,
  createInvoice,
  getInvoice,
  getInvoiceByToken,
  listInvoices,
  updateInvoice,
} from '../services/invoice.service';
import { asyncHandler } from '../utils/async-handler';
import { formatNaira } from '../utils/money';
import { invoiceShareText, publicInvoiceUrl } from '../utils/share';
import type { InvoiceBody, InvoiceEmailBody, InvoiceListQuery } from '../validations/invoice.validation';

const sendPdf = (res: Response, filename: string, pdf: Buffer) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
};

export const getInvoices: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as InvoiceListQuery;

  res.json(await listInvoices(query));
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

export const getInvoicePdf: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const invoice = await getInvoice(id);

  sendPdf(res, `${invoice.number}.pdf`, await buildInvoicePdf(invoice));
});

export const getPublicInvoice: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.params as { token: string };
  const invoice = await getInvoiceByToken(token);

  res.json({
    invoice: {
      id: invoice.id,
      number: invoice.number,
      customer: invoice.customer,
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
  const invoice = await getInvoiceByToken(token);

  sendPdf(res, `${invoice.number}.pdf`, await buildInvoicePdf(invoice));
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

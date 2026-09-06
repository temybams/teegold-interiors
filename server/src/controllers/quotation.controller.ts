import type { RequestHandler, Response } from 'express';

import { buildInvoicePdf, type PdfVariant } from '../lib/invoice-pdf';
import {
  cancelQuotation,
  convertQuotationToInvoice,
  createQuotation,
  getQuotation,
  getQuotationByToken,
  listQuotations,
  updateQuotation,
} from '../services/quotation.service';
import { getCompanySettings } from '../services/settings.service';
import { asyncHandler } from '../utils/async-handler';
import { formatNaira } from '../utils/money';
import { publicQuotationUrl, quotationShareText } from '../utils/share';
import type { QuotationBody, QuotationListQuery } from '../validations/quotation.validation';
import { env } from '../config/env';

const sendPdf = (res: Response, filename: string, pdf: Buffer) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
};

export const getQuotations: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as QuotationListQuery;

  res.json(await listQuotations(query));
});

export const getQuotationById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };

  res.json({ quotation: await getQuotation(id) });
});

export const postQuotation: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as QuotationBody;

  res.status(201).json({ quotation: await createQuotation(body, req.user!.id) });
});

export const patchQuotation: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as QuotationBody;

  res.json({ quotation: await updateQuotation(id, body) });
});

export const patchQuotationCancel: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };

  res.json({ quotation: await cancelQuotation(id) });
});

export const postQuotationConvert: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };

  res.status(201).json(await convertQuotationToInvoice(id, req.user!.id));
});

export const getQuotationShare: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const quotation = await getQuotation(id);
  const url = publicQuotationUrl(env.CLIENT_ORIGIN, quotation.publicToken);

  res.json({
    url,
    message: quotationShareText({
      customerName: quotation.customer.name,
      number: quotation.number,
      total: quotation.total,
      url,
    }),
    phone: quotation.customer.phone,
  });
});

export const getQuotationPdf: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const quotation = await getQuotation(id);

  sendPdf(res, `${quotation.number}.pdf`, await buildInvoicePdf(quotationAsInvoice(quotation), 'quotation'));
});

export const getPublicQuotation: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.params as { token: string };
  const [quotation, company] = await Promise.all([getQuotationByToken(token), getCompanySettings()]);

  res.json({ company, quotation });
});

export const getPublicQuotationPdf: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.params as { token: string };
  const quotation = await getQuotationByToken(token);

  sendPdf(
    res,
    `${quotation.number}.pdf`,
    await buildInvoicePdf(quotationAsInvoice(quotation), 'quotation' as PdfVariant),
  );
});

/** Reuse the invoice PDF builder with quotation-shaped fields. */
const quotationAsInvoice = (quotation: Awaited<ReturnType<typeof getQuotation>>) => ({
  id: quotation.id,
  number: quotation.number,
  customer: quotation.customer,
  createdBy: quotation.createdBy,
  quotationId: null,
  discount: quotation.discount,
  subtotal: quotation.subtotal,
  total: quotation.total,
  amountPaid: 0,
  balance: quotation.total,
  paymentStatus: 'UNPAID' as const,
  jobStatus: 'NOT_STARTED' as const,
  scheduledAt: null,
  completedAt: null,
  publicToken: quotation.publicToken,
  createdAt: quotation.createdAt,
  updatedAt: quotation.updatedAt,
  cancelledAt: quotation.cancelledAt,
  items: quotation.items,
});

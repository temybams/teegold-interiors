import { randomBytes } from 'node:crypto';

import type { Prisma, Product, Quotation, QuotationItem, QuotationStatus } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { forbidden, notFound, unprocessable } from '../utils/http-error';
import { calculateLineTotal, calculateQuantity, calculateTotals, isMeasured } from '../utils/pricing';
import type { QuotationBody, QuotationListQuery } from '../validations/quotation.validation';
import { createCustomer, type PublicCustomer } from './customer.service';
import { getInvoice, type PublicInvoice } from './invoice.service';

export type PublicQuotationItem = {
  id: string;
  productId: string | null;
  nameSnapshot: string;
  pricingType: QuotationItem['pricingType'];
  width: number | null;
  height: number | null;
  area: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PublicQuotation = {
  id: string;
  number: string;
  customer: Pick<PublicCustomer, 'id' | 'name' | 'phone' | 'address'>;
  createdBy: { id: string; name: string } | null;
  discount: number;
  subtotal: number;
  total: number;
  status: QuotationStatus;
  publicToken: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  items: PublicQuotationItem[];
};

export type PublicQuotationSummary = Omit<PublicQuotation, 'items'>;

type QuotationRecord = Quotation & {
  customer: { id: string; name: string; phone: string; address: string };
  createdBy: { id: string; name: string } | null;
  items: QuotationItem[];
  invoice: { id: string; number: string } | null;
};

const quotationInclude = {
  customer: { select: { id: true, name: true, phone: true, address: true } },
  createdBy: { select: { id: true, name: true } },
  items: { orderBy: { id: 'asc' as const } },
  invoice: { select: { id: true, number: true } },
} satisfies Prisma.QuotationInclude;

const toPublicItem = (item: QuotationItem): PublicQuotationItem => ({
  id: item.id,
  productId: item.productId,
  nameSnapshot: item.nameSnapshot,
  pricingType: item.pricingType,
  width: item.width,
  height: item.height,
  area: item.area,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  lineTotal: item.lineTotal,
});

const toPublicQuotation = (row: QuotationRecord): PublicQuotation => ({
  id: row.id,
  number: row.number,
  customer: row.customer,
  createdBy: row.createdBy,
  discount: row.discount,
  subtotal: row.subtotal,
  total: row.total,
  status: row.status,
  publicToken: row.publicToken,
  invoiceId: row.invoice?.id ?? null,
  invoiceNumber: row.invoice?.number ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  cancelledAt: row.cancelledAt,
  items: row.items.map(toPublicItem),
});

const toPublicSummary = (row: QuotationRecord): PublicQuotationSummary => {
  const full = toPublicQuotation(row);
  const { items: _items, ...summary } = full;
  return summary;
};

const nextQuotationNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
  const year = new Date().getFullYear();
  const key = `QT-${year}`;
  const sequence = await tx.numberSequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `${key}-${String(sequence.value).padStart(6, '0')}`;
};

type BuiltItem = {
  productId: string;
  nameSnapshot: string;
  pricingType: Product['pricingType'];
  width: number | null;
  height: number | null;
  area: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

const buildItems = async (
  tx: Prisma.TransactionClient,
  lines: QuotationBody['items'],
  allowInactiveIds: Set<string>,
): Promise<BuiltItem[]> => {
  const products = await tx.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  return lines.map((line, index) => {
    const product = byId.get(line.productId);

    if (!product) {
      throw unprocessable('Please check the highlighted fields', [
        { field: `items.${index}.productId`, message: 'Product not found' },
      ]);
    }

    if (!product.active && !allowInactiveIds.has(product.id)) {
      throw unprocessable('Please check the highlighted fields', [
        { field: `items.${index}.productId`, message: 'That product is no longer in the catalogue' },
      ]);
    }

    const measured = isMeasured(product.pricingType);

    if (measured && (line.width === undefined || line.height === undefined)) {
      throw unprocessable('Please check the highlighted fields', [
        ...(line.width === undefined
          ? [{ field: `items.${index}.width`, message: 'Width is required for products priced per m²' }]
          : []),
        ...(line.height === undefined
          ? [{ field: `items.${index}.height`, message: 'Height is required for products priced per m²' }]
          : []),
      ]);
    }

    if (!measured && line.quantity === undefined) {
      throw unprocessable('Please check the highlighted fields', [
        { field: `items.${index}.quantity`, message: 'Quantity is required for this product' },
      ]);
    }

    const input = {
      pricingType: product.pricingType,
      unitPrice: product.unitPrice,
      width: line.width,
      height: line.height,
      quantity: line.quantity,
    };
    const quantity = calculateQuantity(input);
    const lineTotal = Math.round(calculateLineTotal(input));

    return {
      productId: product.id,
      nameSnapshot: product.name,
      pricingType: product.pricingType,
      width: measured ? (line.width ?? null) : null,
      height: measured ? (line.height ?? null) : null,
      area: measured ? quantity : null,
      quantity,
      unitPrice: product.unitPrice,
      lineTotal,
    };
  });
};

const resolveCustomerId = async (body: QuotationBody): Promise<string> => {
  if (body.customerId) {
    const existing = await prisma.customer.findUnique({ where: { id: body.customerId } });

    if (!existing) {
      throw unprocessable('Please check the highlighted fields', [
        { field: 'customerId', message: 'Client not found' },
      ]);
    }

    return existing.id;
  }

  if (!body.customer) {
    throw unprocessable('Please check the highlighted fields', [
      { field: 'customerId', message: 'Choose a client or add a new one' },
    ]);
  }

  return (await createCustomer(body.customer)).id;
};

const assertEditable = (row: Quotation): void => {
  if (row.status === 'CANCELLED' || row.cancelledAt) {
    throw forbidden('This quotation was cancelled');
  }

  if (row.status === 'CONVERTED') {
    throw forbidden('This quotation was already converted to an invoice');
  }
};

const listWhere = (query: QuotationListQuery): Prisma.QuotationWhereInput => {
  const search = query.q?.trim();
  const status = query.status ?? 'all';

  return {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { customer: { phone: { contains: search.replace(/\s/g, '') } } },
          ],
        }
      : {}),
    ...(status === 'open' ? { status: 'OPEN' } : {}),
    ...(status === 'converted' ? { status: 'CONVERTED' } : {}),
    ...(status === 'cancelled' ? { status: 'CANCELLED' } : {}),
  };
};

export type QuotationCounts = {
  all: number;
  open: number;
  converted: number;
  cancelled: number;
};

export const countQuotations = async (): Promise<QuotationCounts> => {
  const [all, open, converted, cancelled] = await Promise.all([
    prisma.quotation.count(),
    prisma.quotation.count({ where: { status: 'OPEN' } }),
    prisma.quotation.count({ where: { status: 'CONVERTED' } }),
    prisma.quotation.count({ where: { status: 'CANCELLED' } }),
  ]);

  return { all, open, converted, cancelled };
};

export const listQuotations = async (
  query: QuotationListQuery,
): Promise<{
  quotations: PublicQuotationSummary[];
  page: number;
  limit: number;
  total: number;
  counts: QuotationCounts;
}> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const where = listWhere(query);

  const [rows, total, counts] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: quotationInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quotation.count({ where }),
    countQuotations(),
  ]);

  return {
    quotations: rows.map((row) => toPublicSummary(row as QuotationRecord)),
    page,
    limit,
    total,
    counts,
  };
};

export const getQuotation = async (id: string): Promise<PublicQuotation> => {
  const row = await prisma.quotation.findUnique({ where: { id }, include: quotationInclude });

  if (!row) {
    throw notFound('Quotation not found');
  }

  return toPublicQuotation(row as QuotationRecord);
};

export const getQuotationByToken = async (token: string): Promise<PublicQuotation> => {
  const row = await prisma.quotation.findUnique({
    where: { publicToken: token },
    include: quotationInclude,
  });

  if (!row) {
    throw notFound('Quotation not found');
  }

  return toPublicQuotation(row as QuotationRecord);
};

export const createQuotation = async (body: QuotationBody, createdById: string): Promise<PublicQuotation> => {
  const customerId = await resolveCustomerId(body);

  const row = await prisma.$transaction(async (tx) => {
    const items = await buildItems(tx, body.items, new Set());
    const totals = calculateTotals(
      items.map((item) => item.lineTotal),
      body.discount,
    );

    return tx.quotation.create({
      data: {
        number: await nextQuotationNumber(tx),
        customerId,
        createdById,
        discount: Math.round(totals.discount),
        subtotal: Math.round(totals.subtotal),
        total: Math.round(totals.total),
        publicToken: randomBytes(24).toString('base64url'),
        items: { create: items },
      },
      include: quotationInclude,
    });
  });

  return toPublicQuotation(row as QuotationRecord);
};

export const updateQuotation = async (id: string, body: QuotationBody): Promise<PublicQuotation> => {
  const current = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!current) {
    throw notFound('Quotation not found');
  }

  assertEditable(current);

  const customerId = await resolveCustomerId(body);
  const allowInactiveIds = new Set(
    current.items.map((item) => item.productId).filter((value): value is string => Boolean(value)),
  );

  const row = await prisma.$transaction(async (tx) => {
    const items = await buildItems(tx, body.items, allowInactiveIds);
    const totals = calculateTotals(
      items.map((item) => item.lineTotal),
      body.discount,
    );

    await tx.quotationItem.deleteMany({ where: { quotationId: id } });

    return tx.quotation.update({
      where: { id },
      data: {
        customerId,
        discount: Math.round(totals.discount),
        subtotal: Math.round(totals.subtotal),
        total: Math.round(totals.total),
        items: { create: items },
      },
      include: quotationInclude,
    });
  });

  return toPublicQuotation(row as QuotationRecord);
};

export const cancelQuotation = async (id: string): Promise<PublicQuotation> => {
  const current = await prisma.quotation.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Quotation not found');
  }

  if (current.status === 'CANCELLED') {
    throw forbidden('This quotation is already cancelled');
  }

  if (current.status === 'CONVERTED') {
    throw forbidden('A converted quotation cannot be cancelled');
  }

  const row = await prisma.quotation.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: quotationInclude,
  });

  return toPublicQuotation(row as QuotationRecord);
};

const nextInvoiceNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
  const year = new Date().getFullYear();
  const key = `INV-${year}`;
  const sequence = await tx.numberSequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `${key}-${String(sequence.value).padStart(6, '0')}`;
};

export const convertQuotationToInvoice = async (
  id: string,
  createdById: string,
): Promise<{ quotation: PublicQuotation; invoice: PublicInvoice }> => {
  const current = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true, invoice: true },
  });

  if (!current) {
    throw notFound('Quotation not found');
  }

  assertEditable(current);

  if (current.invoice) {
    throw forbidden('This quotation already has an invoice');
  }

  const invoiceId = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        number: await nextInvoiceNumber(tx),
        customerId: current.customerId,
        createdById,
        quotationId: current.id,
        discount: current.discount,
        subtotal: current.subtotal,
        total: current.total,
        amountPaid: 0,
        balance: current.total,
        paymentStatus: 'UNPAID',
        publicToken: randomBytes(24).toString('base64url'),
        items: {
          create: current.items.map((item) => ({
            productId: item.productId,
            nameSnapshot: item.nameSnapshot,
            pricingType: item.pricingType,
            width: item.width,
            height: item.height,
            area: item.area,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });

    await tx.quotation.update({
      where: { id: current.id },
      data: { status: 'CONVERTED' },
    });

    return created.id;
  });

  const [quotation, invoice] = await Promise.all([getQuotation(id), getInvoice(invoiceId)]);

  return { quotation, invoice };
};

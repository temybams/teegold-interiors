import { randomBytes } from 'node:crypto';

import type { Invoice, InvoiceItem, PaymentStatus, Prisma, Product } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { forbidden, notFound, unprocessable } from '../utils/http-error';
import { calculateLineTotal, calculateQuantity, calculateTotals, isMeasured } from '../utils/pricing';
import type { InvoiceBody, InvoiceListQuery } from '../validations/invoice.validation';
import { createCustomer, type PublicCustomer } from './customer.service';

export type PublicInvoiceItem = {
  id: string;
  productId: string | null;
  nameSnapshot: string;
  pricingType: InvoiceItem['pricingType'];
  width: number | null;
  height: number | null;
  area: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PublicInvoiceCustomer = Pick<PublicCustomer, 'id' | 'name' | 'phone' | 'address'>;

export type PublicInvoice = {
  id: string;
  number: string;
  customer: PublicInvoiceCustomer;
  createdBy: { id: string; name: string } | null;
  discount: number;
  subtotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  publicToken: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  items: PublicInvoiceItem[];
};

export type PublicInvoiceSummary = Omit<PublicInvoice, 'items'>;

type InvoiceRecord = Invoice & {
  customer: { id: string; name: string; phone: string; address: string };
  createdBy: { id: string; name: string } | null;
  items: InvoiceItem[];
};

const invoiceInclude = {
  customer: { select: { id: true, name: true, phone: true, address: true } },
  createdBy: { select: { id: true, name: true } },
  items: { orderBy: { id: 'asc' as const } },
} satisfies Prisma.InvoiceInclude;

const toPublicItem = (item: InvoiceItem): PublicInvoiceItem => ({
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

const toPublicInvoice = (invoice: InvoiceRecord): PublicInvoice => ({
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
  publicToken: invoice.publicToken,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt,
  cancelledAt: invoice.cancelledAt,
  items: invoice.items.map(toPublicItem),
});

const toPublicSummary = (invoice: InvoiceRecord): PublicInvoiceSummary => {
  const full = toPublicInvoice(invoice);
  return {
    id: full.id,
    number: full.number,
    customer: full.customer,
    createdBy: full.createdBy,
    discount: full.discount,
    subtotal: full.subtotal,
    total: full.total,
    amountPaid: full.amountPaid,
    balance: full.balance,
    paymentStatus: full.paymentStatus,
    publicToken: full.publicToken,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
    cancelledAt: full.cancelledAt,
  };
};

const nextInvoiceNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
  const year = new Date().getFullYear();
  const key = `INV-${year}`;
  const row = await tx.numberSequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `${key}-${String(row.value).padStart(6, '0')}`;
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
  lines: InvoiceBody['items'],
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

const settle = (total: number, paid: boolean) => ({
  amountPaid: paid ? total : 0,
  balance: paid ? 0 : total,
  paymentStatus: (paid ? 'PAID' : 'UNPAID') as PaymentStatus,
});

const resolveCustomerId = async (body: InvoiceBody): Promise<string> => {
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

const assertEditable = (invoice: Invoice, role: 'ADMIN' | 'STAFF'): void => {
  if (invoice.cancelledAt) {
    throw forbidden('This invoice was cancelled');
  }

  if (invoice.paymentStatus === 'PAID' && role !== 'ADMIN') {
    throw forbidden('A paid invoice can only be changed by an admin');
  }
};

const listWhere = (query: InvoiceListQuery): Prisma.InvoiceWhereInput => {
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
    ...(status === 'paid' ? { cancelledAt: null, paymentStatus: 'PAID' } : {}),
    ...(status === 'pending'
      ? { cancelledAt: null, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } }
      : {}),
    ...(status === 'cancelled' ? { cancelledAt: { not: null } } : {}),
  };
};

export type InvoiceCounts = {
  all: number;
  paid: number;
  pending: number;
  cancelled: number;
};

export const countInvoices = async (): Promise<InvoiceCounts> => {
  const [all, paid, pending, cancelled] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.count({ where: { cancelledAt: null, paymentStatus: 'PAID' } }),
    prisma.invoice.count({
      where: { cancelledAt: null, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
    }),
    prisma.invoice.count({ where: { cancelledAt: { not: null } } }),
  ]);

  return { all, paid, pending, cancelled };
};

export const listInvoices = async (
  query: InvoiceListQuery,
): Promise<{ invoices: PublicInvoiceSummary[]; page: number; limit: number; total: number; counts: InvoiceCounts }> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const where = listWhere(query);

  const [invoices, total, counts] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
    countInvoices(),
  ]);

  return {
    invoices: invoices.map((invoice) => toPublicSummary(invoice as InvoiceRecord)),
    page,
    limit,
    total,
    counts,
  };
};

export const getInvoice = async (id: string): Promise<PublicInvoice> => {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });

  if (!invoice) {
    throw notFound('Invoice not found');
  }

  return toPublicInvoice(invoice as InvoiceRecord);
};

export const getInvoiceByToken = async (token: string): Promise<PublicInvoice> => {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: invoiceInclude,
  });

  if (!invoice) {
    throw notFound('Invoice not found');
  }

  return toPublicInvoice(invoice as InvoiceRecord);
};

export const createInvoice = async (body: InvoiceBody, createdById: string): Promise<PublicInvoice> => {
  const customerId = await resolveCustomerId(body);

  const invoice = await prisma.$transaction(async (tx) => {
    const items = await buildItems(tx, body.items, new Set());
    const totals = calculateTotals(
      items.map((item) => item.lineTotal),
      body.discount,
    );
    const settlement = settle(Math.round(totals.total), body.paid ?? false);

    return tx.invoice.create({
      data: {
        number: await nextInvoiceNumber(tx),
        customerId,
        createdById,
        discount: Math.round(totals.discount),
        subtotal: Math.round(totals.subtotal),
        total: Math.round(totals.total),
        ...settlement,
        publicToken: randomBytes(24).toString('base64url'),
        items: { create: items },
      },
      include: invoiceInclude,
    });
  });

  return toPublicInvoice(invoice as InvoiceRecord);
};

export const updateInvoice = async (
  id: string,
  body: InvoiceBody,
  role: 'ADMIN' | 'STAFF',
): Promise<PublicInvoice> => {
  const current = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!current) {
    throw notFound('Invoice not found');
  }

  assertEditable(current, role);

  const customerId = await resolveCustomerId(body);
  const allowInactiveIds = new Set(
    current.items.map((item) => item.productId).filter((value): value is string => Boolean(value)),
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const items = await buildItems(tx, body.items, allowInactiveIds);
    const totals = calculateTotals(
      items.map((item) => item.lineTotal),
      body.discount,
    );
    const settlement = settle(Math.round(totals.total), body.paid ?? false);

    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

    return tx.invoice.update({
      where: { id },
      data: {
        customerId,
        discount: Math.round(totals.discount),
        subtotal: Math.round(totals.subtotal),
        total: Math.round(totals.total),
        ...settlement,
        items: { create: items },
      },
      include: invoiceInclude,
    });
  });

  return toPublicInvoice(invoice as InvoiceRecord);
};

export const cancelInvoice = async (id: string, role: 'ADMIN' | 'STAFF'): Promise<PublicInvoice> => {
  const current = await prisma.invoice.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Invoice not found');
  }

  if (current.cancelledAt) {
    throw forbidden('This invoice is already cancelled');
  }

  if (current.paymentStatus === 'PAID' && role !== 'ADMIN') {
    throw forbidden('A paid invoice can only be cancelled by an admin');
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { cancelledAt: new Date() },
    include: invoiceInclude,
  });

  return toPublicInvoice(invoice as InvoiceRecord);
};

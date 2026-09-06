import type { Customer } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { conflict, notFound } from '../utils/http-error';

export type PublicCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  invoiceCount: number;
  totalSpent: number;
  createdAt: Date;
};

type CustomerStats = {
  invoiceCount: number;
  totalSpent: number;
};

const emptyStats = (): CustomerStats => ({ invoiceCount: 0, totalSpent: 0 });

export const toPublicCustomer = (customer: Customer, stats: CustomerStats = emptyStats()): PublicCustomer => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  address: customer.address,
  invoiceCount: stats.invoiceCount,
  totalSpent: stats.totalSpent,
  createdAt: customer.createdAt,
});

const statsFor = async (customerIds: string[]): Promise<Map<string, CustomerStats>> => {
  const stats = new Map<string, CustomerStats>(customerIds.map((id) => [id, emptyStats()]));

  if (customerIds.length === 0) {
    return stats;
  }

  const grouped = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customerIds }, cancelledAt: null },
    _count: { _all: true },
    _sum: { total: true },
  });

  for (const row of grouped) {
    stats.set(row.customerId, {
      invoiceCount: row._count._all,
      totalSpent: row._sum.total ?? 0,
    });
  }

  return stats;
};

export const listCustomers = async (q?: string): Promise<PublicCustomer[]> => {
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q.replace(/\s/g, '') } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
  });
  const stats = await statsFor(customers.map((customer) => customer.id));

  return customers.map((customer) => toPublicCustomer(customer, stats.get(customer.id)));
};

export const getCustomer = async (id: string): Promise<PublicCustomer> => {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw notFound('Client not found');
  }

  const stats = await statsFor([id]);
  return toPublicCustomer(customer, stats.get(id));
};

export type CustomerHistoryInvoice = {
  id: string;
  number: string;
  total: number;
  amountPaid: number;
  balance: number;
  paymentStatus: string;
  jobStatus: string;
  createdAt: Date;
  cancelledAt: Date | null;
};

export type CustomerHistoryQuotation = {
  id: string;
  number: string;
  total: number;
  status: string;
  createdAt: Date;
  cancelledAt: Date | null;
};

export type CustomerDetail = PublicCustomer & {
  quotationCount: number;
  invoices: CustomerHistoryInvoice[];
  quotations: CustomerHistoryQuotation[];
};

export const getCustomerDetail = async (id: string): Promise<CustomerDetail> => {
  const customer = await getCustomer(id);

  const [invoices, quotations] = await Promise.all([
    prisma.invoice.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        number: true,
        total: true,
        amountPaid: true,
        balance: true,
        paymentStatus: true,
        jobStatus: true,
        createdAt: true,
        cancelledAt: true,
      },
    }),
    prisma.quotation.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        createdAt: true,
        cancelledAt: true,
      },
    }),
  ]);

  return {
    ...customer,
    quotationCount: quotations.length,
    invoices,
    quotations,
  };
};

export type CustomerInput = {
  name: string;
  phone: string;
  address: string;
};

const digitsOf = (phone: string): string => phone.replace(/\D/g, '');

const assertPhoneFree = async (phone: string, exceptId?: string): Promise<void> => {
  const digits = digitsOf(phone);
  const existing = await prisma.customer.findMany({ select: { id: true, phone: true } });
  const clash = existing.find((row) => row.id !== exceptId && digitsOf(row.phone) === digits);

  if (clash) {
    throw conflict('A client with that phone number already exists', [
      { field: 'phone', message: 'Already on file' },
    ]);
  }
};

export const createCustomer = async (input: CustomerInput): Promise<PublicCustomer> => {
  await assertPhoneFree(input.phone);

  const customer = await prisma.customer.create({ data: input });
  return toPublicCustomer(customer);
};

export const updateCustomer = async (id: string, input: CustomerInput): Promise<PublicCustomer> => {
  const current = await prisma.customer.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Client not found');
  }

  await assertPhoneFree(input.phone, id);

  const customer = await prisma.customer.update({ where: { id }, data: input });
  return toPublicCustomer(customer);
};

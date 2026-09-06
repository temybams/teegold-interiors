import { prisma } from '../lib/prisma';

const startOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfMonth = (value: Date): Date => {
  const next = new Date(value.getFullYear(), value.getMonth(), 1);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const getDashboardSummary = async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const activeWhere = { cancelledAt: null as Date | null };

  const [
    todayAgg,
    monthAgg,
    invoiceCount,
    pendingCount,
    recentInvoices,
    recentCustomers,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { ...activeWhere, createdAt: { gte: todayStart }, paymentStatus: { in: ['PAID', 'PARTIAL'] } },
      _sum: { amountPaid: true },
    }),
    prisma.invoice.aggregate({
      where: { ...activeWhere, createdAt: { gte: monthStart }, paymentStatus: { in: ['PAID', 'PARTIAL'] } },
      _sum: { amountPaid: true },
    }),
    prisma.invoice.count({ where: activeWhere }),
    prisma.invoice.count({
      where: { ...activeWhere, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
    }),
    prisma.invoice.findMany({
      where: activeWhere,
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, phone: true, createdAt: true },
    }),
  ]);

  // Today/month sales: prefer amount paid on invoices created in period; also include
  // unpaid totals for "sales raised" feel — plan said "Today's Sales" which for a
  // shop usually means invoice totals raised that day.
  const todayRaised = await prisma.invoice.aggregate({
    where: { ...activeWhere, createdAt: { gte: todayStart } },
    _sum: { total: true },
  });
  const monthRaised = await prisma.invoice.aggregate({
    where: { ...activeWhere, createdAt: { gte: monthStart } },
    _sum: { total: true },
  });

  return {
    todaySales: todayRaised._sum.total ?? 0,
    monthSales: monthRaised._sum.total ?? 0,
    todayCollected: todayAgg._sum.amountPaid ?? 0,
    monthCollected: monthAgg._sum.amountPaid ?? 0,
    invoiceCount,
    pendingCount,
    recentInvoices: recentInvoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      createdAt: invoice.createdAt,
      customer: invoice.customer,
      createdBy: invoice.createdBy,
    })),
    recentCustomers,
  };
};

export const getReport = async (from: Date, to: Date) => {
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const where = {
    cancelledAt: null as Date | null,
    createdAt: { gte: from, lte: end },
  };

  const [totals, byStatus, invoices, topProducts] = await Promise.all([
    prisma.invoice.aggregate({
      where,
      _sum: { total: true, amountPaid: true, balance: true },
      _count: { _all: true },
    }),
    prisma.invoice.groupBy({
      by: ['paymentStatus'],
      where,
      _count: { _all: true },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.invoiceItem.groupBy({
      by: ['nameSnapshot'],
      where: { invoice: where },
      _sum: { lineTotal: true, quantity: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 8,
    }),
  ]);

  const statusMap = Object.fromEntries(
    byStatus.map((row) => [
      row.paymentStatus,
      { count: row._count._all, total: row._sum.total ?? 0, paid: row._sum.amountPaid ?? 0 },
    ]),
  );

  return {
    from,
    to: end,
    sales: totals._sum.total ?? 0,
    collected: totals._sum.amountPaid ?? 0,
    outstanding: totals._sum.balance ?? 0,
    invoiceCount: totals._count._all,
    unpaid: statusMap.UNPAID ?? { count: 0, total: 0, paid: 0 },
    partial: statusMap.PARTIAL ?? { count: 0, total: 0, paid: 0 },
    paid: statusMap.PAID ?? { count: 0, total: 0, paid: 0 },
    topProducts: topProducts.map((row) => ({
      name: row.nameSnapshot,
      quantity: row._sum.quantity ?? 0,
      total: row._sum.lineTotal ?? 0,
    })),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      customerName: invoice.customer.name,
      createdByName: invoice.createdBy?.name ?? null,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
      paymentStatus: invoice.paymentStatus,
      createdAt: invoice.createdAt,
    })),
  };
};

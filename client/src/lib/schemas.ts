import { z } from 'zod';

/**
 * The client validates what the API sends back, so a mismatched deployment fails
 * loudly here instead of rendering `undefined` somewhere down the page.
 */
export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
});

export type Health = z.infer<typeof healthSchema>;

export const ROLES = ['ADMIN', 'STAFF'] as const;

export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.enum(ROLES),
  status: z.enum(USER_STATUSES),
  inviteExpiresAt: z.string().nullable(),
  activatedAt: z.string().nullable(),
  suspendedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const sessionResponseSchema = z.object({
  user: userSchema,
});

export const loginResponseSchema = sessionResponseSchema;

export const meResponseSchema = z.object({
  user: userSchema,
});

export const usersResponseSchema = z.object({
  users: z.array(userSchema),
});

/**
 * The invite link only comes back on the response that created it — there is no
 * endpoint that hands it out again, so the admin copies it there and then.
 */
export const invitedUserResponseSchema = z.object({
  user: userSchema,
  inviteUrl: z.string().optional(),
  emailed: z.boolean().optional(),
});

export const inviteDetailsResponseSchema = z.object({
  invite: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

export const linePreviewSchema = z.object({
  measured: z.boolean(),
  quantity: z.number(),
  unit: z.string(),
  lineTotal: z.number(),
  lineTotalFormatted: z.string(),
});

export type LinePreview = z.infer<typeof linePreviewSchema>;

export const PRICING_TYPES = ['PER_M2', 'PER_PIECE', 'PER_SERVICE', 'PER_ROLL'] as const;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  pricingType: z.enum(PRICING_TYPES),
  unitPrice: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;

export const productsResponseSchema = z.object({
  products: z.array(productSchema),
});

export const productResponseSchema = z.object({
  product: productSchema,
});

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  invoiceCount: z.number(),
  totalSpent: z.number(),
  createdAt: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;

export const customersResponseSchema = z.object({
  customers: z.array(customerSchema),
});

export const customerResponseSchema = z.object({
  customer: customerSchema,
});

export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const invoiceCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
});

export const invoiceItemSchema = z.object({
  id: z.string(),
  productId: z.string().nullable(),
  nameSnapshot: z.string(),
  pricingType: z.enum(PRICING_TYPES),
  width: z.number().nullable(),
  height: z.number().nullable(),
  area: z.number().nullable(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const invoiceSummarySchema = z.object({
  id: z.string(),
  number: z.string(),
  customer: invoiceCustomerSchema,
  createdBy: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  discount: z.number(),
  subtotal: z.number(),
  total: z.number(),
  amountPaid: z.number(),
  balance: z.number(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  publicToken: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  cancelledAt: z.string().nullable(),
});

export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const invoiceSchema = invoiceSummarySchema.extend({
  items: z.array(invoiceItemSchema),
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const invoiceCountsSchema = z.object({
  all: z.number(),
  paid: z.number(),
  pending: z.number(),
  cancelled: z.number(),
});

export const invoicesResponseSchema = z.object({
  invoices: z.array(invoiceSummarySchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  counts: invoiceCountsSchema,
});

export const invoiceResponseSchema = z.object({
  invoice: invoiceSchema,
});

export const publicInvoiceSchema = invoiceSummarySchema.extend({
  items: z.array(invoiceItemSchema),
});

export type PublicInvoiceView = z.infer<typeof publicInvoiceSchema>;

export const publicInvoiceResponseSchema = z.object({
  company: z
    .object({
      name: z.string(),
      tagline: z.string(),
      phone: z.string(),
      email: z.string(),
      address: z.string(),
      bank: z.object({
        bankName: z.string(),
        accountName: z.string(),
        accountNumber: z.string(),
      }),
    })
    .optional(),
  invoice: publicInvoiceSchema,
});

export const invoiceShareSchema = z.object({
  url: z.string(),
  message: z.string(),
  phone: z.string(),
});

export const invoiceEmailResponseSchema = z.object({
  emailed: z.boolean(),
  url: z.string(),
  message: z.string(),
});

export const companySchema = z.object({
  name: z.string(),
  tagline: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  bank: z.object({
    bankName: z.string(),
    accountName: z.string(),
    accountNumber: z.string(),
  }),
});

export type Company = z.infer<typeof companySchema>;

export const companyResponseSchema = z.object({
  company: companySchema,
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  sortOrder: z.number(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoriesResponseSchema = z.object({
  categories: z.array(categorySchema),
});

export const categoryResponseSchema = z.object({
  category: categorySchema,
});

export const dashboardResponseSchema = z.object({
  todaySales: z.number(),
  monthSales: z.number(),
  todayCollected: z.number(),
  monthCollected: z.number(),
  invoiceCount: z.number(),
  pendingCount: z.number(),
  recentInvoices: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      total: z.number(),
      paymentStatus: z.enum(PAYMENT_STATUSES),
      createdAt: z.string(),
      customer: z.object({ id: z.string(), name: z.string() }),
      createdBy: z.object({ id: z.string(), name: z.string() }).nullable(),
    }),
  ),
  recentCustomers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      phone: z.string(),
      createdAt: z.string(),
    }),
  ),
});

export type DashboardSummary = z.infer<typeof dashboardResponseSchema>;

export const reportResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  sales: z.number(),
  collected: z.number(),
  outstanding: z.number(),
  invoiceCount: z.number(),
  unpaid: z.object({ count: z.number(), total: z.number(), paid: z.number() }),
  partial: z.object({ count: z.number(), total: z.number(), paid: z.number() }),
  paid: z.object({ count: z.number(), total: z.number(), paid: z.number() }),
  topProducts: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      total: z.number(),
    }),
  ),
  invoices: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      customerName: z.string(),
      createdByName: z.string().nullable(),
      total: z.number(),
      amountPaid: z.number(),
      balance: z.number(),
      paymentStatus: z.enum(PAYMENT_STATUSES),
      createdAt: z.string(),
    }),
  ),
});

export type ReportSummary = z.infer<typeof reportResponseSchema>;

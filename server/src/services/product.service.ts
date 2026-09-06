import type { PricingType, Product } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { conflict, notFound } from '../utils/http-error';
import { assertCategoryExists } from './category.service';

export type PublicProduct = {
  id: string;
  name: string;
  category: string;
  pricingType: PricingType;
  unitPrice: number;
  active: boolean;
  createdAt: Date;
};

export const toPublicProduct = (product: Product): PublicProduct => ({
  id: product.id,
  name: product.name,
  category: product.category,
  pricingType: product.pricingType,
  unitPrice: product.unitPrice,
  active: product.active,
  createdAt: product.createdAt,
});

export type ProductListQuery = {
  q?: string;
  category?: string;
  active?: boolean;
};

export const listProducts = async (query: ProductListQuery = {}): Promise<PublicProduct[]> => {
  const products = await prisma.product.findMany({
    where: {
      ...(query.category ? { category: query.category } : {}),
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { category: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return products.map(toPublicProduct);
};

export type ProductInput = {
  name: string;
  category: string;
  pricingType: PricingType;
  unitPrice: number;
  active?: boolean;
};

const assertNameFree = async (name: string, exceptId?: string): Promise<void> => {
  const existing = await prisma.product.findUnique({ where: { name } });

  if (existing && existing.id !== exceptId) {
    throw conflict('A product with that name already exists', [
      { field: 'name', message: 'Already in the catalogue' },
    ]);
  }
};

export const createProduct = async (input: ProductInput): Promise<PublicProduct> => {
  await assertNameFree(input.name);
  await assertCategoryExists(input.category);

  const product = await prisma.product.create({
    data: {
      name: input.name,
      category: input.category,
      pricingType: input.pricingType,
      unitPrice: input.unitPrice,
      active: input.active ?? true,
    },
  });

  return toPublicProduct(product);
};

export const updateProduct = async (id: string, input: ProductInput): Promise<PublicProduct> => {
  const current = await prisma.product.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Product not found');
  }

  await assertNameFree(input.name, id);
  await assertCategoryExists(input.category, {
    requireActive: input.category !== current.category,
  });

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      category: input.category,
      pricingType: input.pricingType,
      unitPrice: input.unitPrice,
      active: input.active ?? current.active,
    },
  });

  return toPublicProduct(product);
};

export const setProductActive = async (id: string, active: boolean): Promise<PublicProduct> => {
  const current = await prisma.product.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Product not found');
  }

  const product = await prisma.product.update({ where: { id }, data: { active } });
  return toPublicProduct(product);
};

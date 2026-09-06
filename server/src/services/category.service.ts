import { prisma } from '../lib/prisma';
import { conflict, notFound } from '../utils/http-error';

export type PublicCategory = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

export const listCategories = async (activeOnly = false): Promise<PublicCategory[]> => {
  const rows = await prisma.productCategory.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    active: row.active,
    sortOrder: row.sortOrder,
  }));
};

export const createCategory = async (name: string): Promise<PublicCategory> => {
  const trimmed = name.trim();
  const existing = await prisma.productCategory.findUnique({ where: { name: trimmed } });

  if (existing) {
    throw conflict('That category already exists', [{ field: 'name', message: 'Already in the list' }]);
  }

  const last = await prisma.productCategory.findFirst({ orderBy: { sortOrder: 'desc' } });
  const row = await prisma.productCategory.create({
    data: { name: trimmed, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });

  return { id: row.id, name: row.name, active: row.active, sortOrder: row.sortOrder };
};

export const updateCategory = async (
  id: string,
  input: { name?: string; active?: boolean },
): Promise<PublicCategory> => {
  const current = await prisma.productCategory.findUnique({ where: { id } });

  if (!current) {
    throw notFound('Category not found');
  }

  if (input.name && input.name.trim() !== current.name) {
    const clash = await prisma.productCategory.findUnique({ where: { name: input.name.trim() } });
    if (clash) {
      throw conflict('That category already exists', [{ field: 'name', message: 'Already in the list' }]);
    }
  }

  const row = await prisma.productCategory.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.active === undefined ? {} : { active: input.active }),
    },
  });

  // Keep product.category strings in sync when renaming.
  if (input.name && input.name.trim() !== current.name) {
    await prisma.product.updateMany({
      where: { category: current.name },
      data: { category: input.name.trim() },
    });
  }

  return { id: row.id, name: row.name, active: row.active, sortOrder: row.sortOrder };
};

export const assertCategoryExists = async (
  name: string,
  options: { requireActive?: boolean } = {},
): Promise<void> => {
  const row = await prisma.productCategory.findFirst({
    where: {
      name,
      ...(options.requireActive === false ? {} : { active: true }),
    },
  });

  if (!row) {
    throw conflict('Choose a category from the list', [
      { field: 'category', message: 'Unknown or disabled category' },
    ]);
  }
};

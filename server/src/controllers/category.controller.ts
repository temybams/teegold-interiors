import type { RequestHandler } from 'express';

import { createCategory, listCategories, updateCategory } from '../services/category.service';
import { asyncHandler } from '../utils/async-handler';
import type {
  CategoryBody,
  CategoryListQuery,
  CategoryUpdateBody,
} from '../validations/category.validation';

export const getCategories: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as CategoryListQuery;

  res.json({ categories: await listCategories(query.active === true) });
});

export const postCategory: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CategoryBody;

  res.status(201).json({ category: await createCategory(body.name) });
});

export const patchCategory: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as CategoryUpdateBody;

  res.json({ category: await updateCategory(id, body) });
});

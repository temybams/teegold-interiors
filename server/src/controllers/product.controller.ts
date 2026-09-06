import type { RequestHandler } from 'express';

import {
  createProduct,
  listProducts,
  setProductActive,
  updateProduct,
} from '../services/product.service';
import { asyncHandler } from '../utils/async-handler';
import type {
  ProductBody,
  ProductListQuery,
  SetProductActiveBody,
} from '../validations/product.validation';

export const getProducts: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as ProductListQuery;

  res.json({ products: await listProducts(query) });
});

export const postProduct: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as ProductBody;

  res.status(201).json({ product: await createProduct(body) });
});

export const patchProduct: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as ProductBody;

  res.json({ product: await updateProduct(id, body) });
});

export const patchProductActive: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { active } = req.body as SetProductActiveBody;

  res.json({ product: await setProductActive(id, active) });
});

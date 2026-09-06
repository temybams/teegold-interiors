import type { RequestHandler } from 'express';

import {
  createCustomer,
  getCustomerDetail,
  listCustomers,
  updateCustomer,
} from '../services/customer.service';
import { asyncHandler } from '../utils/async-handler';
import type { CustomerBody } from '../validations/customer.validation';

export const getCustomers: RequestHandler = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;

  res.json({ customers: await listCustomers(q) });
});

export const getCustomerById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };

  res.json({ customer: await getCustomerDetail(id) });
});

export const postCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CustomerBody;

  res.status(201).json({ customer: await createCustomer(body) });
});

export const patchCustomer: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as CustomerBody;

  res.json({ customer: await updateCustomer(id, body) });
});

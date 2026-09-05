import type { RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

import { unprocessable, type FieldIssue } from '../utils/http-error';

type RequestPart = 'body' | 'query' | 'params';

const toFieldIssues = (error: ZodError): FieldIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

/**
 * Route-level guard: nothing reaches a controller until it matches its schema, so
 * controllers never re-check shapes and the client always gets field-level errors.
 */
export const validate =
  (schemas: Partial<Record<RequestPart, ZodTypeAny>>): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
        Object.assign(req.query as Record<string, unknown>, parsed);
      }

      if (schemas.params) {
        const parsed = schemas.params.parse(req.params) as Record<string, unknown>;
        Object.assign(req.params as Record<string, unknown>, parsed);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(unprocessable('Please check the highlighted fields', toFieldIssues(error)));
        return;
      }

      next(error);
    }
  };

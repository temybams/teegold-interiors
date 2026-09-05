export type FieldIssue = {
  field: string;
  message: string;
};

export type HttpError = Error & {
  status: number;
  code: string;
  issues?: FieldIssue[];
};

/** Every failure leaves the API in one shape, so the client only parses one thing. */
export const httpError = (
  status: number,
  message: string,
  code: string,
  issues?: FieldIssue[],
): HttpError => Object.assign(new Error(message), { status, code, issues });

export const badRequest = (message: string, issues?: FieldIssue[]): HttpError =>
  httpError(400, message, 'BAD_REQUEST', issues);

export const unprocessable = (message: string, issues?: FieldIssue[]): HttpError =>
  httpError(422, message, 'VALIDATION_ERROR', issues);

export const notFound = (message: string): HttpError => httpError(404, message, 'NOT_FOUND');

export const unauthorized = (message = 'Not signed in'): HttpError =>
  httpError(401, message, 'UNAUTHORIZED');

export const forbidden = (message = 'Not allowed'): HttpError =>
  httpError(403, message, 'FORBIDDEN');

export const conflict = (message: string, issues?: FieldIssue[]): HttpError =>
  httpError(409, message, 'CONFLICT', issues);

export const isHttpError = (value: unknown): value is HttpError =>
  value instanceof Error && typeof (value as HttpError).status === 'number';

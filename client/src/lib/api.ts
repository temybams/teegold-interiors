import { clearToken, readToken } from './auth-storage';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ApiIssue = {
  field: string;
  message: string;
};

type ApiErrorBody = {
  error: {
    message: string;
    code: string;
    issues?: ApiIssue[];
  };
};

export type ApiRequestError = Error & {
  status: number;
  code: string;
  issues: ApiIssue[];
};

const apiRequestError = (
  status: number,
  message: string,
  code: string,
  issues: ApiIssue[],
): ApiRequestError =>
  Object.assign(new Error(message), { name: 'ApiRequestError', status, code, issues });

export const isApiRequestError = (value: unknown): value is ApiRequestError =>
  value instanceof Error && value.name === 'ApiRequestError';

/** Single door to the API: attaches the token, and drops it the moment it stops working. */
export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = readToken();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

    // An expired or revoked token is useless — remove it so the app stops
    // pretending to be signed in.
    if (response.status === 401 && token) {
      clearToken();
    }

    throw apiRequestError(
      response.status,
      body?.error.message ?? `Request failed with status ${response.status}`,
      body?.error.code ?? 'UNKNOWN',
      body?.error.issues ?? [],
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const apiPost = <T>(path: string, body?: unknown): Promise<T> =>
  apiFetch<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown): Promise<T> =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

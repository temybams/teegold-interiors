export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ApiErrorBody = {
  error: {
    message: string;
    code: string;
  };
};

export type ApiRequestError = Error & {
  status: number;
  code: string;
};

const apiRequestError = (status: number, message: string, code: string): ApiRequestError =>
  Object.assign(new Error(message), { name: 'ApiRequestError', status, code });

export const isApiRequestError = (value: unknown): value is ApiRequestError =>
  value instanceof Error && value.name === 'ApiRequestError';

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

    throw apiRequestError(
      response.status,
      body?.error.message ?? `Request failed with status ${response.status}`,
      body?.error.code ?? 'UNKNOWN',
    );
  }

  return (await response.json()) as T;
};

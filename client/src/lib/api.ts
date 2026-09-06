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

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
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
      body?.error.issues ?? [],
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

/**
 * One door to the API. Cookies travel with the request. A 401 tries a silent
 * refresh once so an overnight tab does not dump someone mid-invoice.
 */
export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  try {
    return await request<T>(path, init);
  } catch (error) {
    const isRefreshCall = path === '/api/auth/refresh';
    const isAuthEntry =
      path === '/api/auth/login' ||
      path === '/api/auth/invites/accept' ||
      path === '/api/auth/password-reset/confirm';

    if (
      isApiRequestError(error) &&
      error.status === 401 &&
      !isRefreshCall &&
      !isAuthEntry
    ) {
      await request('/api/auth/refresh', { method: 'POST' });
      return request<T>(path, init);
    }

    throw error;
  }
};

export const apiPost = <T>(path: string, body?: unknown): Promise<T> =>
  apiFetch<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown): Promise<T> =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

const triggerDownload = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
};

export const apiDownload = async (path: string, filename: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: 'include' });

  if (!response.ok) {
    throw apiRequestError(response.status, 'Could not download the file', 'DOWNLOAD_FAILED', []);
  }

  triggerDownload(await response.blob(), filename);
};

export const downloadPublicPdf = async (
  token: string,
  filename: string,
  variant: 'invoice' | 'receipt' = 'invoice',
): Promise<void> => {
  const query = variant === 'receipt' ? '?variant=receipt' : '';
  const response = await fetch(`${apiBaseUrl}/api/public/invoices/${token}/pdf${query}`);

  if (!response.ok) {
    throw apiRequestError(response.status, 'Could not download the invoice', 'DOWNLOAD_FAILED', []);
  }

  triggerDownload(await response.blob(), filename);
};

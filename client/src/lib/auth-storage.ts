const TOKEN_KEY = 'teegold.token';

/**
 * The token lives in localStorage, so every read is guarded — this module is
 * imported by components that also render on the server, where there is no window.
 */
export const readToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
};

export const writeToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
};

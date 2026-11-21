import type { ApiResponse, SessionUser } from '../types';

/**
 * ---------------------------------------------------------------------------
 * CORS — WHY WE SEND "text/plain"
 * ---------------------------------------------------------------------------
 * Google Apps Script cannot answer CORS preflight (OPTIONS) requests.
 * Browsers skip the preflight only for "simple" requests, so:
 *   • Content-Type is "text/plain;charset=utf-8" (NOT application/json).
 *     The body is still JSON text; the script runs JSON.parse on it.
 *   • No custom headers (no Authorization). The token goes in the body.
 *   • redirect: "follow" — Apps Script replies with a 302 to
 *     script.googleusercontent.com, which serves the JSON.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? '').trim();
export const IS_DEMO = API_URL === 'mock';

const TOKEN_KEY = 'fu.token';
const USER_KEY = 'fu.user';
export const AUTH_EXPIRED_EVENT = 'fu:auth-expired';
const SESSION_ERROR_RE = /session/i;
const TIMEOUT_MS = 30_000;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && getToken() ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: SessionUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function saveUser(user: SessionUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

async function send<T>(body: string): Promise<ApiResponse<T>> {
  if (IS_DEMO) {
    const { mockHandle } = await import('./mock');
    return mockHandle<T>(body);
  }
  if (!API_URL) {
    throw new Error('VITE_API_URL is not set. Add it to your .env file (see .env.example).');
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error('The server took too long to respond. Please try again.');
    throw new Error(navigator.onLine ? 'Could not reach the server. Please try again.' : 'You are offline. Check your internet connection.');
  } finally {
    window.clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error('Unexpected response from the server. Check that the Web App is deployed with access "Anyone".');
  }
}

/**
 * Calls one backend action. Resolves with `data`, or throws an Error with
 * the server's message. An invalid/expired session logs the user out.
 */
export async function api<T>(action: string, payload: object = {}): Promise<T> {
  const body = JSON.stringify({ action, token: getToken(), payload });
  const json = await send<T>(body);
  if (!json.success) {
    if (action !== 'login' && SESSION_ERROR_RE.test(json.error)) {
      clearAuth();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      if (!window.location.hash.startsWith('#/login')) window.location.hash = '#/login';
    }
    throw new Error(json.error || 'Something went wrong');
  }
  return json.data;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

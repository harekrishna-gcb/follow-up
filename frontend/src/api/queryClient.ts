import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const DAY = 24 * 60 * 60 * 1000;
const NO_RETRY_RE = /session|not allowed|only admins|not found|invalid/i;

/**
 * Apps Script takes 1–3 s per call, so we cache aggressively:
 * data is shown instantly from cache and refreshed in the background.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: DAY,
      refetchOnWindowFocus: true,
      retry: (count, err) => count < 1 && !NO_RETRY_RE.test((err as Error)?.message ?? ''),
    },
    mutations: { retry: 0 },
  },
});

/** Persists the query cache to localStorage so the app opens instantly, even offline. */
export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'fu.cache',
  throttleTime: 1000,
});

export const PERSIST_MAX_AGE = DAY;

export const queryKeys = {
  contacts: ['contacts'] as const,
  contact: (id: string) => ['contact', id] as const,
  callLogs: (contactId: string) => ['callLogs', contactId] as const,
  dashboard: ['dashboard'] as const,
  volunteers: ['volunteers'] as const,
};

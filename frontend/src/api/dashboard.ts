import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './queryClient';
import type { DashboardData } from '../types';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api<DashboardData>('getDashboard'),
    staleTime: 30_000,
  });
}

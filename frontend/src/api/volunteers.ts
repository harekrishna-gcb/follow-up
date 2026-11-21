import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from './client';
import { queryKeys } from './queryClient';
import { changePinRequest } from './auth';
import type { Role, Volunteer } from '../types';

export interface VolunteerInput {
  name: string;
  phone: string;
  role: Role;
  pin?: string;
  active?: boolean;
}

/** Admin-only list. Pass enabled=false for volunteers so no request is made. */
export function useVolunteers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.volunteers,
    queryFn: () => api<Volunteer[]>('getVolunteers'),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useAddVolunteer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VolunteerInput) => api<Volunteer>('addVolunteer', input),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: queryKeys.volunteers });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success(`${v.name} added`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useUpdateVolunteer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<VolunteerInput> & { id: string }) => api<Volunteer>('updateVolunteer', input),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: queryKeys.volunteers });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.contacts });
      toast.success(`${v.name} updated`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useChangePin() {
  return useMutation({
    mutationFn: ({ currentPin, newPin }: { currentPin: string; newPin: string }) => changePinRequest(currentPin, newPin),
    onSuccess: () => toast.success('PIN changed'),
    onError: (err) => toast.error(errorMessage(err)),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from './client';
import { queryKeys } from './queryClient';
import { patchContactCache } from './contacts';
import { useAuth } from '../context/AuthContext';
import type { CallLog, CallStatus, Contact } from '../types';

export function useCallLogs(contactId: string) {
  return useQuery({
    queryKey: queryKeys.callLogs(contactId),
    queryFn: () => api<CallLog[]>('getCallLogs', { contactId }),
    enabled: !!contactId,
  });
}

/** Logs a call with an optimistic history entry and last-call badge. */
export function useLogCall(contactId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = queryKeys.callLogs(contactId);

  return useMutation({
    mutationFn: (input: { status: CallStatus; remarks: string }) =>
      api<CallLog>('logCall', { contactId, ...input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prevLogs = qc.getQueryData<CallLog[]>(key);
      const current =
        qc.getQueryData<Contact>(queryKeys.contact(contactId)) ??
        qc.getQueryData<Contact[]>(queryKeys.contacts)?.find((c) => c.id === contactId);
      const temp: CallLog = {
        id: `temp-${Date.now()}`,
        contactId,
        volunteerId: user?.id ?? '',
        volunteerName: user?.name ?? 'You',
        callDate: new Date().toISOString(),
        status: input.status,
        remarks: input.remarks,
        pending: true,
      };
      qc.setQueryData<CallLog[]>(key, (logs) => (logs ? [temp, ...logs] : logs));
      patchContactCache(qc, contactId, { lastCallDate: temp.callDate, lastCallStatus: input.status });
      return {
        prevLogs,
        tempId: temp.id,
        prevLast: current ? { lastCallDate: current.lastCallDate, lastCallStatus: current.lastCallStatus } : null,
      };
    },
    onError: (err, _vars, ctx) => {
      if (ctx) {
        qc.setQueryData(key, ctx.prevLogs);
        if (ctx.prevLast) patchContactCache(qc, contactId, ctx.prevLast);
      }
      toast.error(errorMessage(err));
    },
    onSuccess: (log, _vars, ctx) => {
      qc.setQueryData<CallLog[]>(key, (logs) => logs?.map((l) => (l.id === ctx?.tempId ? log : l)));
      patchContactCache(qc, contactId, { lastCallDate: log.callDate, lastCallStatus: log.status });
      toast.success('Call logged');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  });
}

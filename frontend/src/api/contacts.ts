import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from './client';
import { queryKeys } from './queryClient';
import {
  COUNTER_LABELS,
  type Contact,
  type ContactInput,
  type ContactRecord,
  type CounterField,
  type Volunteer,
} from '../types';

/* --------------------------- cache helpers --------------------------- */

type Patch = Partial<Contact> | ((c: Contact) => Partial<Contact>);

/** Applies a patch to a contact in both the list and the detail cache. */
export function patchContactCache(qc: QueryClient, id: string, patch: Patch): void {
  const apply = (c: Contact): Contact => ({ ...c, ...(typeof patch === 'function' ? patch(c) : patch) });
  qc.setQueryData<Contact[]>(queryKeys.contacts, (list) => list?.map((c) => (c.id === id ? apply(c) : c)));
  qc.setQueryData<Contact>(queryKeys.contact(id), (c) => (c ? apply(c) : c));
}

function upsertContactInList(qc: QueryClient, contact: Contact): void {
  qc.setQueryData<Contact[]>(queryKeys.contacts, (list) => {
    if (!list) return list;
    const exists = list.some((c) => c.id === contact.id);
    return exists ? list.map((c) => (c.id === contact.id ? contact : c)) : [...list, contact];
  });
  qc.setQueryData(queryKeys.contact(contact.id), contact);
}

/* ------------------------------- queries ------------------------------ */

export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts,
    queryFn: () => api<Contact[]>('getContacts'),
  });
}

export function useContact(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => api<Contact>('getContact', { id }),
    enabled: !!id,
    // Show the list's copy instantly while the full record loads.
    placeholderData: () => qc.getQueryData<Contact[]>(queryKeys.contacts)?.find((c) => c.id === id),
  });
}

/* ------------------------------ mutations ----------------------------- */

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) => api<Contact>('addContact', input),
    onSuccess: (contact) => {
      upsertContactInList(qc, contact);
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.volunteers });
      toast.success(`${contact.name} added`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ContactInput> & { id: string }) => api<Contact>('updateContact', input),
    onSuccess: (contact) => {
      upsertContactInList(qc, contact);
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Changes saved');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** +1 / −1 on an attendance counter, with an optimistic update. */
export function useIncrementField(contactId: string) {
  const qc = useQueryClient();
  const mutationKey = ['increment', contactId];
  return useMutation({
    mutationKey,
    mutationFn: ({ field, by }: { field: CounterField; by: 1 | -1 }) =>
      api<ContactRecord>('incrementField', { id: contactId, field, by }),
    onMutate: async ({ field, by }) => {
      await qc.cancelQueries({ queryKey: queryKeys.contact(contactId) });
      patchContactCache(qc, contactId, (c) => ({ [field]: Math.max(0, c[field] + by) }));
    },
    onError: (err, { field, by }) => {
      patchContactCache(qc, contactId, (c) => ({ [field]: Math.max(0, c[field] - by) }));
      toast.error(errorMessage(err));
    },
    onSuccess: (record, { field, by }) => {
      // With rapid taps, only trust the server once the last tap has landed.
      if (qc.isMutating({ mutationKey }) <= 1) patchContactCache(qc, contactId, record);
      toast.success(`${by > 0 ? '+1' : '−1'} ${COUNTER_LABELS[field]}`, { id: `inc-${field}` });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ id: string }>('deleteContact', { id }),
    onSuccess: ({ id }) => {
      qc.setQueryData<Contact[]>(queryKeys.contacts, (list) => list?.filter((c) => c.id !== id));
      qc.removeQueries({ queryKey: queryKeys.contact(id) });
      qc.removeQueries({ queryKey: queryKeys.callLogs(id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.volunteers });
      toast.success('Contact deleted');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** Bulk assign (volunteerId "" = unassign), optimistic. */
export function useAssignContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { contactIds: string[]; volunteerId: string }) =>
      api<{ updated: number; volunteerName: string | null }>('assignContacts', input),
    onMutate: async ({ contactIds, volunteerId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.contacts });
      const prev = qc.getQueryData<Contact[]>(queryKeys.contacts);
      const name = qc.getQueryData<Volunteer[]>(queryKeys.volunteers)?.find((v) => v.id === volunteerId)?.name ?? null;
      contactIds.forEach((id) =>
        patchContactCache(qc, id, { assignedTo: volunteerId, assignedToName: volunteerId ? name : null }),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.contacts, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSuccess: (res, { volunteerId }) => {
      const who = volunteerId ? res.volunteerName ?? 'volunteer' : null;
      const n = `${res.updated} contact${res.updated === 1 ? '' : 's'}`;
      toast.success(who ? `${n} assigned to ${who}` : `${n} unassigned`);
    },
    onSettled: (_res, _err, { contactIds }) => {
      contactIds.forEach((id) => qc.invalidateQueries({ queryKey: queryKeys.contact(id) }));
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.volunteers });
    },
  });
}

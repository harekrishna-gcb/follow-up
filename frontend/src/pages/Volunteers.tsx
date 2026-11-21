import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, Phone, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useAddVolunteer, useUpdateVolunteer, useVolunteers } from '../api/volunteers';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/TopBar';
import { Avatar } from '../components/Avatar';
import { BottomSheet } from '../components/BottomSheet';
import { Field } from '../components/Field';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Fab } from '../components/Fab';
import type { Role, Volunteer } from '../types';
import { formatPhone, isValidPhone, normalizePhone } from '../utils/phone';
import { cn } from '../utils/cn';

export default function Volunteers() {
  const q = useVolunteers();
  const [editing, setEditing] = useState<Volunteer | 'new' | null>(null);
  const list = q.data ?? [];
  const active = list.filter((v) => v.active).length;

  return (
    <div className="pb-40">
      <TopBar
        large
        title="Volunteers"
        subtitle={q.data ? `${active} active${list.length > active ? ` · ${list.length - active} inactive` : ''}` : undefined}
        actions={
          <button type="button" className="icon-btn" onClick={() => setEditing('new')} aria-label="Add volunteer">
            <UserPlus className="h-5 w-5" />
          </button>
        }
      />

      <div className="p-4">
        {q.isPending ? (
          <div className="card divide-y divide-slate-100">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : q.isError && !q.data ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title="No volunteers yet" description="Add volunteers so you can assign contacts to them." />
        ) : (
          <ul className="card divide-y divide-slate-100 overflow-hidden">
            {list.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setEditing(v)}
                  className={cn('flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-slate-50', !v.active && 'opacity-60')}
                >
                  <Avatar name={v.name} className={cn(!v.active && 'grayscale')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-semibold">{v.name}</p>
                      {v.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                      {!v.active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Inactive</span>
                      )}
                    </div>
                    <p className="truncate text-[13px] text-slate-500">
                      {v.phone ? <span className="tabular-nums">{formatPhone(v.phone)}</span> : 'No phone'} · {v.assignedCount ?? 0} contacts
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Fab onClick={() => setEditing('new')} icon={<UserPlus className="h-5 w-5" />} label="Add volunteer" />

      <VolunteerSheet volunteer={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/* ----------------------------- add / edit sheet ----------------------------- */

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Too long'),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || isValidPhone(v), 'Enter a 10-digit mobile number, or leave empty')
    .transform((v) => (v ? normalizePhone(v) : '')),
  role: z.enum(['admin', 'volunteer']),
  active: z.boolean(),
  pin: z.string().refine((v) => !v || /^\d{4}$/.test(v), 'PIN must be exactly 4 digits'),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

function VolunteerSheet({ volunteer, onClose }: { volunteer: Volunteer | 'new' | null; onClose: () => void }) {
  const { user } = useAuth();
  const add = useAddVolunteer();
  const update = useUpdateVolunteer();
  const isNew = volunteer === 'new';
  const v = volunteer && volunteer !== 'new' ? volunteer : null;
  const isSelf = v?.id === user?.id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!volunteer) return;
    reset(
      v
        ? { name: v.name, phone: v.phone, role: v.role, active: v.active, pin: '' }
        : { name: '', phone: '', role: 'volunteer', active: true, pin: '' },
    );
  }, [volunteer, v, reset]);

  const saving = add.isPending || update.isPending;

  const onSubmit = (values: FormOut) => {
    if (isNew) {
      if (!values.pin) return setError('pin', { message: 'Set a 4-digit PIN for their first login' });
      add.mutate({ name: values.name, phone: values.phone, role: values.role, pin: values.pin }, { onSuccess: onClose });
    } else if (v) {
      update.mutate(
        { id: v.id, name: values.name, phone: values.phone, role: values.role, active: values.active, ...(values.pin ? { pin: values.pin } : {}) },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <BottomSheet
      open={!!volunteer}
      onClose={onClose}
      title={isNew ? 'Add volunteer' : `Edit ${v?.name ?? ''}`}
      description={isNew ? 'They’ll log in with their name and this PIN.' : undefined}
      footer={
        <button type="submit" form="volunteer-form" className="btn-primary btn-lg w-full" disabled={saving}>
          {saving && <Spinner />}
          {isNew ? 'Add volunteer' : 'Save changes'}
        </button>
      }
    >
      <form id="volunteer-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pb-2">
        <Field label="Name" htmlFor="v-name" error={errors.name?.message} hint="Used to log in, so keep it unique.">
          <input id="v-name" autoCapitalize="words" autoComplete="off" className={cn('input', errors.name && 'input-error')} {...register('name')} />
        </Field>
        <Field label="Phone" htmlFor="v-phone" error={errors.phone?.message} optional>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="v-phone" type="tel" inputMode="tel" className={cn('input pl-10 tabular-nums', errors.phone && 'input-error')} {...register('phone')} />
          </div>
        </Field>

        <div>
          <span className="label">Role</span>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="radiogroup" aria-label="Role">
                {(['volunteer', 'admin'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={field.value === r}
                    disabled={isSelf}
                    onClick={() => field.onChange(r)}
                    className={cn(
                      'min-h-[44px] rounded-xl text-[15px] font-semibold capitalize transition',
                      field.value === r ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          />
          <p className="mt-1.5 text-sm text-slate-500">
            {isSelf ? 'You can’t change your own role.' : 'Admins can add, assign and delete contacts and manage volunteers.'}
          </p>
        </div>

        <Field
          label={isNew ? 'PIN' : 'Reset PIN'}
          htmlFor="v-pin"
          error={errors.pin?.message}
          hint={isNew ? '4 digits. Ask them to change it in Settings.' : 'Leave empty to keep their current PIN. Resetting signs them out.'}
        >
          <input
            id="v-pin"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            placeholder={isNew ? '••••' : 'New 4-digit PIN'}
            className={cn('input tabular-nums tracking-widest', errors.pin && 'input-error')}
            {...register('pin')}
          />
        </Field>

        {!isNew && (
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className={cn('flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200', isSelf && 'opacity-60')}>
                <span>
                  <span className="block font-semibold">Active</span>
                  <span className="block text-sm text-slate-500">
                    {isSelf ? 'You can’t deactivate yourself.' : 'Inactive volunteers can’t log in. Their contacts stay assigned.'}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!field.value}
                  disabled={isSelf}
                  onClick={() => field.onChange(!field.value)}
                  className={cn('relative h-8 w-14 shrink-0 rounded-full transition', field.value ? 'bg-brand-500' : 'bg-slate-300')}
                >
                  <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', field.value ? 'left-7' : 'left-1')} />
                </button>
              </label>
            )}
          />
        )}
      </form>
    </BottomSheet>
  );
}

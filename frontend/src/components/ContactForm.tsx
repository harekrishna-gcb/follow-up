import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { Field } from './Field';
import { Spinner } from './Spinner';
import { COUNTER_FIELDS, COUNTER_LABELS, type ContactInput, type Volunteer } from '../types';
import { isValidPhone, normalizePhone } from '../utils/phone';
import { todayISODate } from '../utils/date';
import { cn } from '../utils/cn';

const count = (label: string) =>
  z
    .number({ invalid_type_error: `${label}: enter a number`, required_error: `${label} is required` })
    .int('Whole numbers only')
    .min(0, 'Cannot be negative')
    .max(100000, 'Too large');

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Too long'),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, 'Enter a 10-digit mobile number')
    .transform(normalizePhone),
  area: z.string().trim().max(100, 'Too long'),
  pgName: z.string().trim().max(100, 'Too long'),
  firstContactDate: z
    .string()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Pick a valid date')
    .refine((v) => !v || v <= todayISODate(), 'Date cannot be in the future'),
  chantingRounds: count('Chanting rounds').max(200, 'That seems too high'),
  booksReading: z.string().trim().max(500, 'Too long'),
  sundayServiceCount: count('Sunday Service'),
  tripsAttended: count('Trips'),
  eventsAttended: count('Events'),
  weekdaySessionsAttended: count('Weekday Sessions'),
  assignedTo: z.string(),
  notes: z.string().trim().max(5000, 'Too long'),
});

type FormValues = z.input<typeof contactSchema>;

export const EMPTY_CONTACT: ContactInput = {
  name: '',
  phone: '',
  area: '',
  pgName: '',
  firstContactDate: todayISODate(),
  chantingRounds: 0,
  booksReading: '',
  sundayServiceCount: 0,
  tripsAttended: 0,
  eventsAttended: 0,
  weekdaySessionsAttended: 0,
  assignedTo: '',
  notes: '',
};

interface ContactFormProps {
  defaultValues: ContactInput;
  /** volunteers can only edit sadhana, attendance and notes */
  isAdmin: boolean;
  volunteers?: Volunteer[];
  submitting?: boolean;
  submitLabel: string;
  /** new records can be submitted without changes */
  allowPristine?: boolean;
  onSubmit: (values: ContactInput) => void;
}

export function ContactForm({ defaultValues, isAdmin, volunteers = [], submitting, submitLabel, allowPristine, onSubmit }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues, unknown, ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const num = { valueAsNumber: true } as const;
  const inputCls = (err?: unknown) => cn('input', !!err && 'input-error');
  const activeVolunteers = volunteers.filter((v) => v.active || v.id === defaultValues.assignedTo);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="pb-32">
      <div className="space-y-6 p-4">
        {isAdmin ? (
          <fieldset className="space-y-4">
            <legend className="section-title mb-2">Basic info</legend>
            <div className="card space-y-4 p-4">
              <Field label="Full name" htmlFor="name" error={errors.name?.message}>
                <input id="name" autoComplete="off" autoCapitalize="words" className={inputCls(errors.name)} placeholder="e.g. Rohan Verma" {...register('name')} />
              </Field>
              <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message} hint="10 digits. +91 or a leading 0 is removed automatically.">
                <input id="phone" type="tel" inputMode="tel" autoComplete="off" className={cn(inputCls(errors.phone), 'tabular-nums')} placeholder="98765 43210" {...register('phone')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Area" htmlFor="area" error={errors.area?.message} optional>
                  <input id="area" autoCapitalize="words" className={inputCls(errors.area)} placeholder="Koramangala" {...register('area')} />
                </Field>
                <Field label="PG name" htmlFor="pgName" error={errors.pgName?.message} optional>
                  <input id="pgName" autoCapitalize="words" className={inputCls(errors.pgName)} placeholder="Sri Sai PG" {...register('pgName')} />
                </Field>
              </div>
              <Field label="First contact date" htmlFor="firstContactDate" error={errors.firstContactDate?.message}>
                <input id="firstContactDate" type="date" max={todayISODate()} className={inputCls(errors.firstContactDate)} {...register('firstContactDate')} />
              </Field>
            </div>
          </fieldset>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-slate-100 p-3.5 text-sm text-slate-600">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Name, phone and assignment can only be changed by an admin.
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="section-title mb-2">Sadhana</legend>
          <div className="card space-y-4 p-4">
            <Field label="Chanting rounds per day" htmlFor="chantingRounds" error={errors.chantingRounds?.message}>
              <input id="chantingRounds" type="number" inputMode="numeric" min={0} className={cn(inputCls(errors.chantingRounds), 'tabular-nums')} {...register('chantingRounds', num)} />
            </Field>
            <Field label="Books reading" htmlFor="booksReading" error={errors.booksReading?.message} optional>
              <input id="booksReading" className={inputCls(errors.booksReading)} placeholder="e.g. Bhagavad Gita As It Is" {...register('booksReading')} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="section-title mb-2">Attendance</legend>
          <div className="card grid grid-cols-2 gap-3 p-4">
            {COUNTER_FIELDS.map((f) => (
              <Field key={f} label={COUNTER_LABELS[f]} htmlFor={f} error={errors[f]?.message}>
                <input id={f} type="number" inputMode="numeric" min={0} className={cn(inputCls(errors[f]), 'tabular-nums')} {...register(f, num)} />
              </Field>
            ))}
          </div>
        </fieldset>

        {isAdmin && (
          <fieldset className="space-y-2">
            <legend className="section-title mb-2">Assignment</legend>
            <div className="card p-4">
              <Field label="Assigned volunteer" htmlFor="assignedTo">
                <select id="assignedTo" className="input appearance-none bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10" style={{ backgroundImage: CHEVRON }} {...register('assignedTo')}>
                  <option value="">Unassigned</option>
                  {activeVolunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.role === 'admin' ? ' (admin)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>
        )}

        <fieldset className="space-y-2">
          <legend className="section-title mb-2">Notes</legend>
          <div className="card p-4">
            <Field label="Notes" htmlFor="notes" error={errors.notes?.message} optional>
              <textarea id="notes" rows={4} className={cn(inputCls(errors.notes), 'resize-y')} placeholder="Interests, family, best time to call…" {...register('notes')} />
            </Field>
          </div>
        </fieldset>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="pb-safe mx-auto max-w-app border-t border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="p-3">
            <button type="submit" className="btn-primary btn-lg w-full" disabled={submitting || (!isDirty && !allowPristine)}>
              {submitting && <Spinner className="h-5 w-5" />}
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

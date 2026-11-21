import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  Bus,
  CalendarDays,
  CalendarHeart,
  Clock,
  History,
  MapPin,
  Pencil,
  PhoneCall,
  Phone,
  Sparkles,
  StickyNote,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAssignContacts, useContact, useDeleteContact, useIncrementField } from '../api/contacts';
import { useCallLogs, useLogCall } from '../api/calls';
import { useVolunteers } from '../api/volunteers';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/TopBar';
import { Avatar } from '../components/Avatar';
import { CallButton } from '../components/CallButton';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CounterButton } from '../components/CounterButton';
import { InfoRow, Section } from '../components/Section';
import { LastCallSummary, STATUS_META } from '../components/StatusBadge';
import { LogCallSheet } from '../components/LogCallSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProfileSkeleton, Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { roundsTier } from '../components/RoundsBadge';
import { CHEVRON } from '../components/ContactForm';
import { COUNTER_LABELS, type CallLog, type CounterField } from '../types';
import { formatDate, formatDateTime, formatRelative } from '../utils/date';
import { formatPhone } from '../utils/phone';
import { cn } from '../utils/cn';

const COUNTER_ICONS = {
  sundayServiceCount: Sun,
  tripsAttended: Bus,
  eventsAttended: Sparkles,
  weekdaySessionsAttended: CalendarDays,
} as const;

export default function Profile() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const contactQuery = useContact(id);
  const logsQuery = useCallLogs(id);
  const { data: volunteers = [] } = useVolunteers(isAdmin);
  const increment = useIncrementField(id);
  const logCall = useLogCall(id);
  const assign = useAssignContacts();
  const del = useDeleteContact();

  const [logOpen, setLogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // After tapping "Call", offer to log the call as soon as the user comes back to the app.
  const awaitingCallReturn = useRef(false);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && awaitingCallReturn.current) {
        awaitingCallReturn.current = false;
        setLogOpen(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const c = contactQuery.data;

  if (!c) {
    return (
      <div>
        <TopBar back title="Contact" />
        {contactQuery.isError ? (
          <ErrorState message={errorMessage(contactQuery.error)} onRetry={() => contactQuery.refetch()} />
        ) : (
          <ProfileSkeleton />
        )}
      </div>
    );
  }

  const tier = roundsTier(c.chantingRounds);
  const inc = (field: CounterField, by: 1 | -1) => increment.mutate({ field, by });
  const assignable = volunteers.filter((v) => v.active || v.id === c.assignedTo);

  return (
    <div className="pb-32">
      <TopBar
        back
        title={c.name}
        subtitle={contactQuery.isFetching ? 'Updating…' : undefined}
        actions={
          <button type="button" className="icon-btn" onClick={() => navigate(`/contact/${c.id}/edit`)} aria-label="Edit contact">
            <Pencil className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-6 p-4">
        {/* Hero */}
        <div className="card animate-rise-in p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar name={c.name} size="xl" />
            <h2 className="mt-3 text-xl font-bold tracking-tight">{c.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{[c.area, c.pgName].filter(Boolean).join(' · ') || 'No area added'}</p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              <LastCallSummary lastCallDate={c.lastCallDate} lastCallStatus={c.lastCallStatus} />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <CallButton phone={c.phone} onCall={() => (awaitingCallReturn.current = true)} />
            <WhatsAppButton phone={c.phone} />
          </div>
          <p className="mt-3 text-center text-sm tabular-nums text-slate-500">+91 {formatPhone(c.phone)}</p>
        </div>

        {/* Sadhana */}
        <Section title="Sadhana">
          <div className="flex items-center gap-4 p-4">
            <div className={cn('flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl', tier.bg)}>
              <span className={cn('text-2xl font-bold leading-none tabular-nums', tier.text)}>{c.chantingRounds}</span>
              <span className={cn('mt-1 text-[10px] font-semibold uppercase tracking-wide', tier.text)}>rounds</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Chanting rounds / day</p>
              <p className={cn('text-sm font-medium', tier.text)}>{tier.label}</p>
            </div>
          </div>
          <div className="border-t border-slate-100">
            <InfoRow icon={BookOpen} label="Books reading" value={c.booksReading} />
          </div>
        </Section>

        {/* Attendance */}
        <Section title="Attendance" bare>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(COUNTER_ICONS) as CounterField[]).map((f) => (
              <CounterButton
                key={f}
                label={COUNTER_LABELS[f]}
                icon={COUNTER_ICONS[f]}
                value={c[f]}
                onIncrement={() => inc(f, 1)}
                onDecrement={() => inc(f, -1)}
              />
            ))}
          </div>
        </Section>

        {/* Basic info */}
        <Section title="Basic info">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={Phone} label="Phone" value={<span className="tabular-nums">+91 {formatPhone(c.phone)}</span>} />
            <InfoRow icon={MapPin} label="Area" value={c.area} />
            <InfoRow icon={Building2} label="PG name" value={c.pgName} />
            <InfoRow
              icon={CalendarHeart}
              label="First contact"
              value={c.firstContactDate ? `${formatDate(c.firstContactDate)} · ${formatRelative(c.firstContactDate)}` : ''}
            />
          </div>
        </Section>

        {/* Assignment */}
        <Section title="Assignment">
          {isAdmin ? (
            <label className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <UserRound className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-slate-500">Assigned to</span>
                <select
                  className="-ml-1 mt-0.5 w-full appearance-none rounded-lg bg-transparent bg-[length:18px] bg-[right_4px_center] bg-no-repeat py-1 pl-1 pr-8 text-[15px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  style={{ backgroundImage: CHEVRON }}
                  value={c.assignedTo}
                  onChange={(e) => assign.mutate({ contactIds: [c.id], volunteerId: e.target.value })}
                  aria-label="Assign to volunteer"
                >
                  <option value="">Unassigned</option>
                  {assignable.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.role === 'admin' ? ' (admin)' : ''}
                      {!v.active ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          ) : (
            <InfoRow icon={UserRound} label="Assigned to" value={c.assignedToName ?? 'You'} />
          )}
        </Section>

        {/* Notes */}
        <Section
          title="Notes"
          action={
            <button type="button" className="btn-ghost min-h-[36px] px-2 text-sm text-brand-700" onClick={() => navigate(`/contact/${c.id}/edit`)}>
              Edit
            </button>
          }
        >
          <div className="flex gap-3 p-4">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            {c.notes ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">{c.notes}</p>
            ) : (
              <p className="text-[15px] text-slate-400">No notes yet. Add interests, family details or the best time to call.</p>
            )}
          </div>
        </Section>

        {/* Call history */}
        <Section
          title="Call history"
          action={logsQuery.data && logsQuery.data.length > 0 ? <span className="text-xs text-slate-400">{logsQuery.data.length} call{logsQuery.data.length === 1 ? "" : "s"}</span> : undefined}
        >
          <CallHistory logs={logsQuery.data} loading={logsQuery.isPending} error={logsQuery.isError ? errorMessage(logsQuery.error) : null} />
        </Section>

        {/* Danger zone */}
        {isAdmin && (
          <button type="button" className="btn w-full text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete contact
          </button>
        )}
        <p className="text-center text-xs text-slate-400">
          Added {formatDate(c.createdAt)} · Updated {formatRelative(c.updatedAt).toLowerCase()}
        </p>
      </div>

      {/* Sticky log call bar */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="pb-safe mx-auto max-w-app border-t border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="p-3">
            <button type="button" className="btn btn-lg w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => setLogOpen(true)}>
              <PhoneCall className="h-5 w-5" />
              Log call
            </button>
          </div>
        </div>
      </div>

      <LogCallSheet open={logOpen} onClose={() => setLogOpen(false)} contactName={c.name} onSubmit={(input) => logCall.mutate(input)} />

      <ConfirmDialog
        open={confirmDelete}
        danger
        title={`Delete ${c.name}?`}
        message="This removes the contact and their entire call history. This cannot be undone."
        confirmLabel="Delete"
        loading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          del.mutate(c.id, {
            onSuccess: () => navigate('/', { replace: true }),
            onSettled: () => setConfirmDelete(false),
          })
        }
      />
    </div>
  );
}

function CallHistory({ logs, loading, error }: { logs?: CallLog[]; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) return <p className="p-4 text-sm text-rose-600">{error}</p>;
  if (!logs?.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <History className="h-6 w-6 text-slate-300" />
        <p className="text-sm text-slate-500">No calls logged yet.</p>
      </div>
    );
  }
  return (
    <ol className="p-4">
      {logs.map((l, i) => {
        const meta = STATUS_META[l.status] ?? STATUS_META['Not Called'];
        const Icon = meta.icon;
        const last = i === logs.length - 1;
        return (
          <li key={l.id} className={cn('relative flex gap-3', !last && 'pb-5', l.pending && 'opacity-60')}>
            {!last && <span className="absolute left-[18px] top-10 h-[calc(100%-2.5rem)] w-px bg-slate-200" aria-hidden />}
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.tile)}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="font-semibold">{l.status}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {l.pending ? 'Saving…' : formatDateTime(l.callDate)}
                </p>
              </div>
              <p className="text-xs text-slate-500">by {l.volunteerName}</p>
              {l.remarks && (
                <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{l.remarks}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

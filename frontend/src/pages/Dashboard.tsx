import { useNavigate } from 'react-router-dom';
import { ChevronRight, PartyPopper, PhoneCall, RefreshCw, TriangleAlert, UserRoundX, Users, type LucideIcon } from 'lucide-react';
import { useDashboard } from '../api/dashboard';
import { errorMessage } from '../api/client';
import { TopBar } from '../components/TopBar';
import { Section } from '../components/Section';
import { Avatar } from '../components/Avatar';
import { DashboardSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/StatusBadge';
import { PullToRefresh } from '../components/PullToRefresh';
import { presetHomeFilters } from '../utils/filters';
import { daysSince } from '../utils/date';
import { cn } from '../utils/cn';

const OVERDUE_PREVIEW = 15;

export default function Dashboard() {
  const navigate = useNavigate();
  const q = useDashboard();
  const d = q.data;

  const openHome = (filters: Parameters<typeof presetHomeFilters>[0]) => {
    presetHomeFilters(filters);
    navigate('/');
  };

  const refresh = (
    <button type="button" className="icon-btn" onClick={() => q.refetch()} disabled={q.isFetching} aria-label="Refresh">
      <RefreshCw className={cn('h-5 w-5', q.isFetching && 'animate-spin')} />
    </button>
  );

  if (!d) {
    return (
      <div className="pb-24">
        <TopBar large title="Dashboard" actions={refresh} />
        {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : <DashboardSkeleton />}
      </div>
    );
  }

  const { totals } = d;
  const pct = totals.totalContacts ? Math.round((totals.calledThisWeek / totals.totalContacts) * 100) : 0;

  return (
    <div className="pb-24">
      <TopBar large title="Dashboard" subtitle="Last 7 days" actions={refresh} />
      <PullToRefresh onRefresh={() => q.refetch()}>
        <div className="space-y-6 p-4">
          {/* Coverage hero */}
          <div className="relative animate-rise-in overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-white shadow-float">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-white/10" />
            <p className="text-sm font-medium text-white/85">Called this week</p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
              {totals.calledThisWeek}
              <span className="text-xl font-semibold text-white/70"> / {totals.totalContacts}</span>
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-white/85">{pct}% of contacts reached in the last 7 days</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Total contacts" value={totals.totalContacts} onClick={() => openHome({})} />
            <StatCard icon={PhoneCall} label="Called this week" value={totals.calledThisWeek} tone="emerald" />
            <StatCard
              icon={TriangleAlert}
              label="Needs follow-up"
              value={totals.needsFollowUp}
              tone="amber"
              onClick={() => openHome({ followUp: true, sort: 'lastCall' })}
            />
            <StatCard
              icon={UserRoundX}
              label="Unassigned"
              value={totals.unassigned}
              tone="slate"
              onClick={() => openHome({ volunteer: 'unassigned' })}
            />
          </div>

          {/* Per volunteer */}
          <Section title="Volunteers">
            {d.volunteers.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No volunteers yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_repeat(3,3.5rem)] gap-1 border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <span>Name</span>
                  <span className="text-right">Assigned</span>
                  <span className="text-right">Called</span>
                  <span className="text-right">Pending</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {d.volunteers.map((v) => {
                    const p = v.assigned ? Math.round((v.calledThisWeek / v.assigned) * 100) : 0;
                    return (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => openHome({ volunteer: v.id })}
                          className="grid w-full grid-cols-[1fr_repeat(3,3.5rem)] items-center gap-1 px-4 py-3 text-left transition active:bg-slate-50"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={v.name} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className={cn('block truncate text-[15px] font-medium', !v.active && 'text-slate-400')}>
                                {v.name}
                                {!v.active && <span className="ml-1 text-xs">(inactive)</span>}
                              </span>
                              <span className="mt-1 block h-1.5 w-full max-w-[7rem] overflow-hidden rounded-full bg-slate-100">
                                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${p}%` }} />
                              </span>
                            </span>
                          </span>
                          <span className="text-right tabular-nums text-slate-700">{v.assigned}</span>
                          <span className="text-right tabular-nums text-emerald-700">{v.calledThisWeek}</span>
                          <span className={cn('text-right font-semibold tabular-nums', v.pending ? 'text-amber-700' : 'text-slate-400')}>
                            {v.pending}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Section>

          {/* Needs follow-up */}
          <Section
            title={`Needs follow-up (${totals.needsFollowUp})`}
            action={
              totals.needsFollowUp > OVERDUE_PREVIEW ? (
                <button type="button" className="btn-ghost min-h-[36px] px-2 text-sm text-brand-700" onClick={() => openHome({ followUp: true, sort: 'lastCall' })}>
                  See all
                </button>
              ) : undefined
            }
          >
            {d.overdue.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <PartyPopper className="h-7 w-7 text-emerald-500" />
                <p className="font-semibold">Everyone’s been called this week</p>
                <p className="text-sm text-slate-500">Wonderful seva!</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {d.overdue.slice(0, OVERDUE_PREVIEW).map((c) => {
                  const days = daysSince(c.lastCallDate);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/contact/${c.id}`)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-slate-50"
                      >
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{c.name}</p>
                          <p className="truncate text-xs text-slate-500">{c.assignedToName ?? 'Unassigned'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="whitespace-nowrap text-xs font-semibold text-amber-700">
                            {days === null ? 'Never called' : `${days} days`}
                          </span>
                          {c.lastCallStatus && <StatusBadge status={c.lastCallStatus} className="text-[10px]" />}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      </PullToRefresh>
    </div>
  );
}

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-500',
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'brand',
  hint,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: keyof typeof TONES;
  hint?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {onClick && <ChevronRight className="h-4 w-4 text-slate-300" />}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-[13px] font-medium text-slate-500">
        {label}
        {hint && <span className="text-slate-400"> · {hint}</span>}
      </p>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="card p-4 text-left transition active:scale-[0.98]">
      {content}
    </button>
  ) : (
    <div className="card p-4">{content}</div>
  );
}

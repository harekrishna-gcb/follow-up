import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  CheckCheck,
  ChevronDown,
  Inbox,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { useAssignContacts, useContacts } from '../api/contacts';
import { useVolunteers } from '../api/volunteers';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePersistentState, usePersistentString } from '../hooks/usePersistentState';
import { TopBar } from '../components/TopBar';
import { ContactCard } from '../components/ContactCard';
import { ContactListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Fab } from '../components/Fab';
import { PullToRefresh } from '../components/PullToRefresh';
import { OptionSheet, type Option } from '../components/OptionSheet';
import { Avatar } from '../components/Avatar';
import {
  DEFAULT_FILTERS,
  FILTERS_KEY,
  QUERY_KEY,
  ROUNDS_OPTIONS,
  SORT_OPTIONS,
  activeFilterCount,
  applyFilters,
  type HomeFilters,
  type RoundsFilter,
  type SortKey,
} from '../utils/filters';
import { needsFollowUp } from '../utils/date';
import { cn } from '../utils/cn';

type SheetName = 'rounds' | 'volunteer' | 'sort' | 'assign' | null;

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const contactsQuery = useContacts();
  const { data: volunteers = [] } = useVolunteers(isAdmin);
  const assign = useAssignContacts();

  const [query, setQuery] = usePersistentString(QUERY_KEY);
  const [filters, setFilters] = usePersistentState<HomeFilters>(FILTERS_KEY, DEFAULT_FILTERS);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const contacts = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);
  const list = useMemo(() => applyFilters(contacts, query, filters), [contacts, query, filters]);
  const followUpCount = useMemo(() => contacts.filter((c) => needsFollowUp(c.lastCallDate)).length, [contacts]);
  const filterCount = activeFilterCount(filters);

  const setFilter = <K extends keyof HomeFilters>(key: K, value: HomeFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startSelect = useCallback((id?: string) => {
    setSelectMode(true);
    setSelected(new Set(id ? [id] : []));
  }, []);

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const allVisibleSelected = list.length > 0 && list.every((c) => selected.has(c.id));
  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(list.map((c) => c.id)));

  const doAssign = (volunteerId: string) => {
    assign.mutate({ contactIds: [...selected], volunteerId: volunteerId === '__none' ? '' : volunteerId });
    exitSelect();
  };

  const volunteerName = (id: string) => volunteers.find((v) => v.id === id)?.name ?? 'Volunteer';
  const volunteerLabel =
    filters.volunteer === 'all' ? 'Everyone' : filters.volunteer === 'unassigned' ? 'Unassigned' : volunteerName(filters.volunteer);
  const roundsLabel = ROUNDS_OPTIONS.find((o) => o.value === filters.rounds)?.label ?? 'Rounds';

  const volunteerOptions: Option<string>[] = [
    { value: 'all', label: 'Everyone', description: 'All contacts' },
    { value: 'unassigned', label: 'Unassigned', description: 'Not given to anyone yet' },
    ...volunteers
      .filter((v) => v.active)
      .map((v) => ({
        value: v.id,
        label: v.name,
        description: `${v.assignedCount ?? 0} contacts`,
        icon: <Avatar name={v.name} size="sm" />,
      })),
  ];

  const assignOptions: Option<string>[] = [
    ...volunteers
      .filter((v) => v.active)
      .map((v) => ({
        value: v.id,
        label: v.name,
        description: `${v.role === 'admin' ? 'Admin · ' : ''}${v.assignedCount ?? 0} contacts`,
        icon: <Avatar name={v.name} size="sm" />,
      })),
    {
      value: '__none',
      label: 'Remove assignment',
      description: 'Mark as unassigned',
      icon: (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <X className="h-4 w-4" />
        </span>
      ),
    },
  ];

  const subtitle = contactsQuery.data
    ? list.length === contacts.length
      ? `${contacts.length} contact${contacts.length === 1 ? '' : 's'}${followUpCount ? ` · ${followUpCount} need follow-up` : ''}`
      : `Showing ${list.length} of ${contacts.length}`
    : `Hare Krishna, ${user?.name ?? ''}`;

  return (
    <div className="pb-40">
      {selectMode ? (
        <TopBar
          className="bg-brand-50/90"
          left={
            <button type="button" className="icon-btn" onClick={exitSelect} aria-label="Cancel selection">
              <X className="h-6 w-6" />
            </button>
          }
          title={`${selected.size} selected`}
          subtitle="Tap contacts to select"
          actions={
            <button type="button" className="btn-ghost px-3 text-brand-700" onClick={toggleAll}>
              <CheckCheck className="h-4 w-4" />
              {allVisibleSelected ? 'None' : 'All'}
            </button>
          }
        />
      ) : (
        <TopBar
          large
          title="Contacts"
          subtitle={subtitle}
          actions={
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => contactsQuery.refetch()}
                aria-label="Refresh"
                disabled={contactsQuery.isFetching}
              >
                <RefreshCw className={cn('h-5 w-5', contactsQuery.isFetching && 'animate-spin')} />
              </button>
              {isAdmin && contacts.length > 0 && (
                <button type="button" className="icon-btn" onClick={() => startSelect()} aria-label="Select contacts">
                  <ListChecks className="h-5 w-5" />
                </button>
              )}
            </>
          }
        />
      )}

      {/* Search + filters */}
      <div className="space-y-3 px-4 pb-2 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, area, PG…"
            className="input rounded-2xl bg-white pl-11 pr-11 shadow-card"
            enterKeyHint="search"
            aria-label="Search contacts"
          />
          {query && (
            <button
              type="button"
              className="icon-btn absolute right-0.5 top-1/2 h-10 w-10 -translate-y-1/2 text-slate-400"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
          <button
            type="button"
            className={cn('chip', filters.followUp && 'chip-active')}
            onClick={() => setFilter('followUp', !filters.followUp)}
            aria-pressed={filters.followUp}
          >
            <span className={cn('h-2 w-2 rounded-full', filters.followUp ? 'bg-brand-500' : 'bg-amber-400')} />
            Needs follow-up
            {followUpCount > 0 && <span className="tabular-nums text-slate-400">{followUpCount}</span>}
          </button>
          {isAdmin && (
            <button
              type="button"
              className={cn('chip', filters.volunteer !== 'all' && 'chip-active')}
              onClick={() => setSheet('volunteer')}
            >
              <UserRound className="h-4 w-4" />
              {volunteerLabel}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          )}
          <button
            type="button"
            className={cn('chip', filters.rounds !== 'any' && 'chip-active')}
            onClick={() => setSheet('rounds')}
          >
            {filters.rounds === 'any' ? 'Rounds' : roundsLabel}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
          <button type="button" className="chip" onClick={() => setSheet('sort')} aria-label="Sort">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </button>
          {filterCount > 0 && (
            <button
              type="button"
              className="chip text-slate-500"
              onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))}
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      <PullToRefresh onRefresh={() => contactsQuery.refetch()}>
        <div className="px-4 pt-1">
          {contactsQuery.isPending ? (
            <ContactListSkeleton />
          ) : contactsQuery.isError && !contactsQuery.data ? (
            <ErrorState message={errorMessage(contactsQuery.error)} onRetry={() => contactsQuery.refetch()} />
          ) : contacts.length === 0 ? (
            isAdmin ? (
              <EmptyState
                icon={UserPlus}
                title="No contacts yet"
                description="Add the first person you’re in touch with. You can assign contacts to volunteers later."
                action={
                  <button type="button" className="btn-primary" onClick={() => navigate('/contact/new')}>
                    <Plus className="h-4 w-4" />
                    Add contact
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="Nobody assigned to you yet"
                description="When an admin assigns contacts to you, they’ll show up here, ready to call."
              />
            )
          ) : list.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description={query ? `Nothing matches “${query}” with the current filters.` : 'No contacts match these filters.'}
              action={
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setQuery('');
                    setFilters(DEFAULT_FILTERS);
                  }}
                >
                  Clear search & filters
                </button>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {list.map((c) => (
                <li key={c.id}>
                  <ContactCard
                    contact={c}
                    selectMode={selectMode}
                    selected={selected.has(c.id)}
                    showAssignee={isAdmin}
                    onToggle={toggle}
                    onLongPress={isAdmin ? startSelect : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
          {isAdmin && !selectMode && contacts.length > 1 && (
            <p className="py-6 text-center text-xs text-slate-400">Tip: long-press a contact to select several and assign them.</p>
          )}
        </div>
      </PullToRefresh>

      {/* Admin: add contact */}
      {isAdmin && !selectMode && (
        <Fab onClick={() => navigate('/contact/new')} icon={<Plus className="h-5 w-5" strokeWidth={2.6} />} label="Add" />
      )}

      {/* Select mode action bar (covers the bottom nav) */}
      {selectMode && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-rise-in">
          <div className="pb-safe mx-auto max-w-app border-t border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="flex gap-3 p-3">
              <button type="button" className="btn-secondary btn-lg" onClick={exitSelect}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-lg flex-1"
                disabled={selected.size === 0}
                onClick={() => setSheet('assign')}
              >
                <UserPlus className="h-5 w-5" />
                Assign {selected.size > 0 ? selected.size : ''} to…
              </button>
            </div>
          </div>
        </div>
      )}

      <OptionSheet<RoundsFilter>
        open={sheet === 'rounds'}
        onClose={() => setSheet(null)}
        title="Chanting rounds"
        options={ROUNDS_OPTIONS}
        value={filters.rounds}
        onSelect={(v) => setFilter('rounds', v)}
      />
      <OptionSheet<SortKey>
        open={sheet === 'sort'}
        onClose={() => setSheet(null)}
        title="Sort by"
        options={SORT_OPTIONS}
        value={filters.sort}
        onSelect={(v) => setFilter('sort', v)}
      />
      {isAdmin && (
        <>
          <OptionSheet<string>
            open={sheet === 'volunteer'}
            onClose={() => setSheet(null)}
            title="Show contacts of"
            options={volunteerOptions}
            value={filters.volunteer}
            onSelect={(v) => setFilter('volunteer', v)}
          />
          <OptionSheet<string>
            open={sheet === 'assign'}
            onClose={() => setSheet(null)}
            title={`Assign ${selected.size} contact${selected.size === 1 ? '' : 's'}`}
            description="Choose who will follow up with them."
            options={assignOptions}
            onSelect={doAssign}
          />
        </>
      )}
    </div>
  );
}

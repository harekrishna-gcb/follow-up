import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Phone, UserRound } from 'lucide-react';
import type { Contact } from '../types';
import { Avatar } from './Avatar';
import { RoundsBadge } from './RoundsBadge';
import { LastCallSummary } from './StatusBadge';
import { useLongPress } from '../hooks/useLongPress';
import { formatPhone, telHref } from '../utils/phone';
import { cn } from '../utils/cn';

interface ContactCardProps {
  contact: Contact;
  selectMode?: boolean;
  selected?: boolean;
  showAssignee?: boolean;
  onToggle?: (id: string) => void;
  /** enables long-press to start select mode */
  onLongPress?: (id: string) => void;
}

export const ContactCard = memo(function ContactCard({
  contact: c,
  selectMode,
  selected,
  showAssignee,
  onToggle,
  onLongPress,
}: ContactCardProps) {
  const navigate = useNavigate();
  const { handlers, consumeLongPress } = useLongPress(() => onLongPress?.(c.id), {
    disabled: !onLongPress || selectMode,
  });

  const handleClick = () => {
    if (consumeLongPress()) return;
    if (selectMode) onToggle?.(c.id);
    else navigate(`/contact/${c.id}`);
  };

  return (
    <div
      className={cn(
        'card no-callout flex select-none items-stretch overflow-hidden transition',
        selected && 'bg-brand-50/60 ring-2 ring-brand-400',
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        {...handlers}
        className="flex min-w-0 flex-1 items-center gap-3 p-3.5 text-left transition active:bg-slate-50"
        aria-pressed={selectMode ? selected : undefined}
        aria-label={selectMode ? `${selected ? 'Deselect' : 'Select'} ${c.name}` : `Open ${c.name}`}
      >
        {selectMode ? (
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition',
              selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white',
            )}
          >
            {selected && <Check className="h-5 w-5" strokeWidth={3} />}
          </span>
        ) : (
          <Avatar name={c.name} />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-slate-900">{c.name}</p>
          <p className="truncate text-[13px] text-slate-500">
            <span className="tabular-nums">{formatPhone(c.phone)}</span>
            {c.area && <span> · {c.area}</span>}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <LastCallSummary lastCallDate={c.lastCallDate} lastCallStatus={c.lastCallStatus} />
          </div>
          {showAssignee && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
              <UserRound className="h-3 w-3" />
              {c.assignedToName ?? 'Unassigned'}
            </p>
          )}
        </div>

        <RoundsBadge rounds={c.chantingRounds} />
      </button>

      {!selectMode && (
        <a
          href={telHref(c.phone)}
          className="flex w-14 shrink-0 items-center justify-center border-l border-slate-100 text-brand-600 transition hover:bg-brand-50 active:bg-brand-100"
          aria-label={`Call ${c.name}`}
        >
          <Phone className="h-5 w-5" strokeWidth={2.3} />
        </a>
      )}
    </div>
  );
});

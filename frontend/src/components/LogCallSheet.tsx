import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { STATUS_META } from './StatusBadge';
import { CALL_STATUSES, type CallStatus } from '../types';
import { cn } from '../utils/cn';

// "Not Called" is the implicit state before any call, so it isn't offered here.
const OPTIONS = CALL_STATUSES.filter((s) => s !== 'Not Called');
const QUICK_REMARKS = ['Will come on Sunday', 'Call back later', 'Busy with exams', 'Out of town', 'Interested in trip'];

interface LogCallSheetProps {
  open: boolean;
  onClose: () => void;
  contactName: string;
  onSubmit: (input: { status: CallStatus; remarks: string }) => void;
}

export function LogCallSheet({ open, onClose, contactName, onSubmit }: LogCallSheetProps) {
  const [status, setStatus] = useState<CallStatus | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (open) {
      setStatus(null);
      setRemarks('');
    }
  }, [open]);

  const addQuick = (text: string) => setRemarks((r) => (r.trim() ? `${r.trim()}. ${text}` : text));

  const submit = () => {
    if (!status) return;
    onSubmit({ status, remarks: remarks.trim() });
    onClose(); // optimistic: the entry shows up immediately
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Log call"
      description={`How did the call with ${contactName} go?`}
      footer={
        <button type="button" className="btn-primary btn-lg w-full" disabled={!status} onClick={submit}>
          Save call
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Call status">
        {OPTIONS.map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setStatus(s)}
              className={cn(
                'flex min-h-[64px] items-center gap-2.5 rounded-2xl px-3 text-left text-[15px] font-semibold ring-1 ring-inset transition active:scale-[0.98]',
                active ? cn(meta.tile, 'ring-2 ring-current') : 'bg-white text-slate-700 ring-slate-200',
              )}
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.tile)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="leading-tight">{s}</span>
            </button>
          );
        })}
      </div>

      <label htmlFor="remarks" className="label mt-5">
        Remarks <span className="font-normal text-slate-400">(optional)</span>
      </label>
      <textarea
        id="remarks"
        rows={3}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        maxLength={1000}
        placeholder="What did you talk about?"
        className="input resize-none"
      />
      <div className="no-scrollbar -mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 pb-1">
        {QUICK_REMARKS.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => addQuick(q)}>
            + {q}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

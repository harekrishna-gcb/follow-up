import { useState } from 'react';
import { Minus, Plus, type LucideIcon } from 'lucide-react';

interface CounterButtonProps {
  label: string;
  value: number;
  icon: LucideIcon;
  onIncrement: () => void;
  onDecrement: () => void;
}

/** Attendance counter tile with a big +1 and a small undo (−1). */
export function CounterButton({ label, value, icon: Icon, onIncrement, onDecrement }: CounterButtonProps) {
  const [bump, setBump] = useState(0);

  return (
    <div className="card flex flex-col p-3.5">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate text-[13px] font-medium">{label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span key={bump} className={`text-3xl font-bold tabular-nums tracking-tight ${bump ? 'animate-bump' : ''}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= 0}
          className="icon-btn h-10 w-10 text-slate-400"
          aria-label={`Remove one from ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setBump((b) => b + 1);
          onIncrement();
        }}
        className="btn-soft mt-2 w-full"
        aria-label={`Add one to ${label}`}
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} />1
      </button>
    </div>
  );
}

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { cn } from '../utils/cn';

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface OptionSheetProps<T extends string> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: Option<T>[];
  value?: T;
  onSelect: (value: T) => void;
}

/** A list of large, tappable choices in a bottom sheet (used for filters and pickers). */
export function OptionSheet<T extends string>({ open, onClose, title, description, options, value, onSelect }: OptionSheetProps<T>) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      <ul className="-mx-2 pb-2">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onSelect(o.value);
                  onClose();
                }}
                className={cn(
                  'flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:bg-slate-100',
                  selected && 'bg-brand-50/70',
                )}
              >
                {o.icon}
                <div className="min-w-0 flex-1">
                  <div className={cn('font-medium', selected && 'text-brand-800')}>{o.label}</div>
                  {o.description && <div className="truncate text-sm text-slate-500">{o.description}</div>}
                </div>
                {selected && <Check className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={2.6} />}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}

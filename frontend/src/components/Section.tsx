import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface SectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  /** render children without the card wrapper */
  bare?: boolean;
  className?: string;
}

export function Section({ title, action, children, bare, className }: SectionProps) {
  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex min-h-[28px] items-center justify-between">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {bare ? children : <div className="card overflow-hidden">{children}</div>}
    </section>
  );
}

export function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="truncate text-[15px] text-slate-900">{value || <span className="text-slate-400">—</span>}</div>
      </div>
    </div>
  );
}

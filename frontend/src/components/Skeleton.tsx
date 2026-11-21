import { cn } from '../utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-slate-200/70', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function ContactListSkeleton({ count = 7 }: { count?: number }) {
  return (
    <ul className="space-y-2.5" aria-label="Loading contacts">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card flex items-center gap-3 p-3.5">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-4 w-1/3 rounded-full" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </li>
      ))}
    </ul>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading">
      <div className="card flex flex-col items-center gap-3 p-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
        <div className="mt-2 flex w-full gap-3">
          <Skeleton className="h-14 flex-1 rounded-2xl" />
          <Skeleton className="h-14 flex-1 rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading">
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

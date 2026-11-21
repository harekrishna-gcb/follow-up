import type { ReactNode } from 'react';

/** Extended floating action button, sitting above the bottom nav. */
export function Fab({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-20">
      <div className="mx-auto flex max-w-app justify-end px-4">
        <button
          type="button"
          onClick={onClick}
          className="pointer-events-auto inline-flex h-14 items-center gap-2 rounded-2xl bg-brand-500 pl-4 pr-5 text-[15px] font-semibold text-white shadow-float transition hover:bg-brand-600 active:scale-95"
        >
          {icon}
          {label}
        </button>
      </div>
    </div>
  );
}

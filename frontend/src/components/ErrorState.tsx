import { CloudOff, RefreshCw } from 'lucide-react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
        <CloudOff className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold">Couldn’t load this</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

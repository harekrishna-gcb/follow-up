import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert } from 'lucide-react';
import { Spinner } from './Spinner';
import { cn } from '../utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/45" onClick={() => !loading && onCancel()} />
      <div className="relative w-full max-w-sm animate-pop-in rounded-3xl bg-white p-6 text-center shadow-2xl">
        {danger && (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <TriangleAlert className="h-6 w-6" />
          </div>
        )}
        <h2 className="text-lg font-bold">{title}</h2>
        {message && <p className="mt-1.5 text-[15px] text-slate-600">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn(danger ? 'btn-danger' : 'btn-primary', 'flex-1')}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

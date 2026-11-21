import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** sticky footer, e.g. the primary action */
  footer?: ReactNode;
}

/** Mobile-style sheet that slides up from the bottom. Closes on backdrop tap or Escape. */
export function BottomSheet({ open, onClose, title, description, children, footer }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className={cn('absolute inset-0 bg-slate-900/40 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
        onClick={() => closeRef.current()}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-app">
        <div
          className={cn(
            'pointer-events-auto flex max-h-[90dvh] flex-col rounded-t-[28px] bg-white shadow-sheet transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]',
            shown ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          <div className="flex justify-center pb-1 pt-2.5">
            <div className="h-1.5 w-10 rounded-full bg-slate-200" />
          </div>
          {title && (
            <div className="flex items-start gap-2 px-5 pb-3 pt-1">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
              </div>
              <button type="button" className="icon-btn -mr-2 -mt-1.5" onClick={() => closeRef.current()} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className={cn('overflow-y-auto overscroll-contain px-5', footer ? 'pb-4' : 'pb-[max(env(safe-area-inset-bottom),20px)]')}>
            {children}
          </div>
          {footer && (
            <div className="border-t border-slate-100 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

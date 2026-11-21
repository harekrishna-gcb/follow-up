import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn';

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** true = go back in history (or home); string = go to that path */
  back?: boolean | string;
  /** replaces the back button / left spacer */
  left?: ReactNode;
  actions?: ReactNode;
  /** larger title for top-level tabs */
  large?: boolean;
  className?: string;
}

export function TopBar({ title, subtitle, back, left, actions, large, className }: TopBarProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (typeof back === 'string') navigate(back);
    else if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <header
      className={cn(
        'pt-safe sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        {left ??
          (back ? (
            <button type="button" className="icon-btn" onClick={goBack} aria-label="Back">
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <div className="w-2" />
          ))}
        <div className="min-w-0 flex-1 px-1">
          <h1 className={cn('truncate font-bold leading-tight tracking-tight', large ? 'text-xl' : 'text-[17px]')}>
            {title}
          </h1>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-0.5 pr-1">{actions}</div>}
      </div>
    </header>
  );
}

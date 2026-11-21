import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { ArrowDown } from 'lucide-react';
import { Spinner } from './Spinner';

const THRESHOLD = 64;
const MAX = 96;

/** Pull down at the top of the page to refresh (touch devices). */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    if (refreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0 || window.scrollY > 0) {
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
      setDragging(false);
      return;
    }
    setDragging(true);
    pullRef.current = Math.min(MAX, dy * 0.45);
    setPull(pullRef.current);
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (pullRef.current >= THRESHOLD) {
      setRefreshing(true);
      setPull(52);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
    pullRef.current = 0;
  };

  const ready = pull >= THRESHOLD;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div
        className="flex items-end justify-center overflow-hidden"
        style={{ height: pull, transition: dragging ? 'none' : 'height .25s ease' }}
        aria-hidden={!refreshing}
      >
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-card ring-1 ring-slate-900/5">
          {refreshing ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4 transition-transform" style={{ transform: ready ? 'rotate(180deg)' : undefined }} />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

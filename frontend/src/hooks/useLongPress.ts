import { useCallback, useRef, type PointerEvent } from 'react';

/** Long-press detection that cancels on scroll/move, for "select mode" on touch screens. */
export function useLongPress(onLongPress: () => void, { delay = 450, disabled = false } = {}) {
  const timer = useRef<number | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current);
    origin.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      fired.current = false;
      if (disabled || e.button > 0) return;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        navigator.vibrate?.(12);
        onLongPress();
      }, delay);
    },
    [delay, disabled, onLongPress],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!origin.current) return;
      if (Math.abs(e.clientX - origin.current.x) > 10 || Math.abs(e.clientY - origin.current.y) > 10) cancel();
    },
    [cancel],
  );

  /** Call at the start of onClick: returns true if this click ended a long press. */
  const consumeLongPress = useCallback(() => {
    const was = fired.current;
    fired.current = false;
    return was;
  }, []);

  return {
    consumeLongPress,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: { preventDefault: () => void }) => {
        if (!disabled) e.preventDefault();
      },
    },
  };
}

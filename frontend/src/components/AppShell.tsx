import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';

const TAB_PATHS = ['/', '/dashboard', '/volunteers', '/settings'];
const scrollPositions = new Map<string, number>();

/** Centered mobile column (max 480px) + bottom nav on top-level tabs. */
export function AppShell() {
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);

  // Remember scroll per screen, so "back" lands where you were in the list.
  useLayoutEffect(() => {
    window.scrollTo(0, scrollPositions.get(pathname) ?? 0);
    const onScroll = () => scrollPositions.set(pathname, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return (
    <div className="relative mx-auto min-h-dvh max-w-app bg-slate-50 sm:shadow-2xl sm:shadow-slate-900/10">
      <OfflineBanner />
      <Outlet />
      {isTab && <BottomNav />}
    </div>
  );
}

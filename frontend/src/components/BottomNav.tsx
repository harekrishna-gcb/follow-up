import { NavLink } from 'react-router-dom';
import { House, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  admin?: boolean;
}

const ITEMS: Item[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, admin: true },
  { to: '/volunteers', label: 'Volunteers', icon: Users, admin: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const { isAdmin } = useAuth();
  const items = ITEMS.filter((i) => !i.admin || isAdmin);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30" aria-label="Main">
      <div className="pb-safe mx-auto max-w-app border-t border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <ul className="flex h-16">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                    isActive ? 'text-brand-700' : 'text-slate-500 active:text-slate-700',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-brand-100/80',
                      )}
                    >
                      <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

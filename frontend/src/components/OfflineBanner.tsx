import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="pt-safe sticky top-0 z-40 bg-slate-800 text-white">
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium">
        <WifiOff className="h-3.5 w-3.5" />
        You’re offline — showing saved data
      </div>
    </div>
  );
}

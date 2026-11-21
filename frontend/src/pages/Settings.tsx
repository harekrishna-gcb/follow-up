import { useState, type FormEvent } from 'react';
import { Download, Info, KeyRound, LogOut, RotateCcw, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChangePin } from '../api/volunteers';
import { IS_DEMO } from '../api/client';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { TopBar } from '../components/TopBar';
import { Avatar } from '../components/Avatar';
import { Section } from '../components/Section';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Spinner } from '../components/Spinner';
import { cn } from '../utils/cn';

export default function Settings() {
  const { user, isAdmin, logout } = useAuth();
  const install = useInstallPrompt();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <div className="pb-24">
      <TopBar large title="Settings" />
      <div className="space-y-6 p-4">
        <div className="card flex items-center gap-4 p-4">
          <Avatar name={user?.name ?? '?'} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user?.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-500">
              {isAdmin ? <ShieldCheck className="h-4 w-4 text-brand-600" /> : <UserRound className="h-4 w-4" />}
              {isAdmin ? 'Admin' : 'Volunteer'}
            </p>
          </div>
        </div>

        <ChangePinCard />

        {!install.installed && (
          <Section title="App">
            <div className="flex gap-3 p-4">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Install on your phone</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {install.isIOS
                    ? 'In Safari, tap the Share button, then “Add to Home Screen”.'
                    : install.canPrompt
                      ? 'Add Follow-up to your home screen for one-tap access.'
                      : 'In Chrome, open the ⋮ menu and choose “Install app” or “Add to Home screen”.'}
                </p>
                {install.canPrompt && (
                  <button type="button" className="btn-soft mt-3" onClick={install.prompt}>
                    <Download className="h-4 w-4" />
                    Install app
                  </button>
                )}
              </div>
            </div>
          </Section>
        )}

        {IS_DEMO && <DemoCard />}

        <button type="button" className="btn-secondary btn-lg w-full text-rose-600" onClick={() => setConfirmLogout(true)}>
          <LogOut className="h-5 w-5" />
          Log out
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Follow-up v1.0
        </p>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You’ll need your name and PIN to log in again."
        confirmLabel="Log out"
        loading={loggingOut}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setLoggingOut(true);
          await logout();
        }}
      />
    </div>
  );
}

function ChangePinCard() {
  const change = useChangePin();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(current)) return setError('Enter your current 4-digit PIN');
    if (!/^\d{4}$/.test(next)) return setError('New PIN must be 4 digits');
    if (next !== confirm) return setError('New PINs don’t match');
    if (next === current) return setError('New PIN must be different');
    change.mutate(
      { currentPin: current, newPin: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
        },
        onError: (err) => setError((err as Error).message),
      },
    );
  };

  const pinInput = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        autoComplete={autoComplete}
        placeholder="••••"
        className={cn('input text-center text-lg tracking-[0.5em]', error && 'input-error')}
        value={value}
        onChange={(e) => set(digits(e.target.value))}
      />
    </div>
  );

  return (
    <Section title="Security">
      <form onSubmit={submit} noValidate className="space-y-4 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-5 w-5 text-brand-600" />
          Change PIN
        </div>
        {pinInput('pin-current', 'Current PIN', current, setCurrent, 'current-password')}
        <div className="grid grid-cols-2 gap-3">
          {pinInput('pin-new', 'New PIN', next, setNext, 'new-password')}
          {pinInput('pin-confirm', 'Confirm', confirm, setConfirm, 'new-password')}
        </div>
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={change.isPending}>
          {change.isPending && <Spinner className="h-4 w-4" />}
          Update PIN
        </button>
      </form>
    </Section>
  );
}

function DemoCard() {
  const { logout } = useAuth();
  return (
    <Section title="Demo mode">
      <div className="space-y-3 p-4 text-sm text-slate-600">
        <p>
          You’re using the built-in demo backend. Data lives only in this browser. Set <code className="rounded bg-slate-100 px-1">VITE_API_URL</code> to your Apps Script URL to use Google Sheets.
        </p>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={async () => {
            const { resetMockDb } = await import('../api/mock');
            resetMockDb();
            await logout();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset demo data
        </button>
      </div>
    </Section>
  );
}

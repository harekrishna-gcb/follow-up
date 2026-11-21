import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { IS_DEMO, errorMessage } from '../api/client';
import { Spinner } from '../components/Spinner';
import { cn } from '../utils/cn';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState(() => localStorage.getItem('fu.lastName') ?? '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Enter your name');
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be 4 digits');
    setLoading(true);
    try {
      const u = await login(name, pin);
      localStorage.setItem('fu.lastName', name.trim());
      toast.success(`Hare Krishna, ${u.name}!`);
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-app flex-col overflow-hidden bg-slate-50">
      {/* soft saffron glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-200/70 to-transparent blur-3xl" />

      <div className="pt-safe relative flex flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="./pwa-192.png" alt="" className="h-20 w-20 rounded-[26px] shadow-float" />
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">Follow-up</h1>
          <p className="mt-1 text-[15px] text-slate-500">Stay in touch, one call at a time.</p>
        </div>

        <form onSubmit={submit} noValidate className="card space-y-4 p-5">
          <div>
            <label htmlFor="name" className="label">
              Your name
            </label>
            <input
              id="name"
              className="input"
              autoComplete="username"
              autoCapitalize="words"
              placeholder="e.g. Ravi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pin" className="label">
              4-digit PIN
            </label>
            <div className="relative">
              <input
                id="pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="current-password"
                maxLength={4}
                placeholder="••••"
                className={cn('input pr-12 text-center text-2xl font-semibold tracking-[0.6em] placeholder:tracking-[0.6em]', error && 'input-error')}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <button
                type="button"
                className="icon-btn absolute right-0.5 top-0.5 text-slate-400"
                onClick={() => setShowPin((s) => !s)}
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
            {loading && <Spinner />}
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        {IS_DEMO && (
          <div className="mt-5 flex gap-3 rounded-2xl bg-white/70 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <div>
              <p className="font-semibold text-slate-800">Demo mode</p>
              <p className="mt-0.5">
                Try <b>Admin</b> / <b>1234</b>, or volunteer <b>Ravi</b> / <b>1111</b>. Data stays in this browser.
              </p>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">Forgot your PIN? Ask an admin to reset it.</p>
      </div>
    </div>
  );
}

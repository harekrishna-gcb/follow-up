import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  optional?: boolean;
}

export function Field({ label, htmlFor, error, hint, children, optional }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}

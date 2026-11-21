import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** useState that survives navigating away and back (sessionStorage). */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? ({ ...(initial as object), ...JSON.parse(raw) } as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);
  return [value, setValue];
}

/** Same, for primitive values like a search string. */
export function usePersistentString(key: string, initial = ''): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState<string>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);
  return [value, setValue];
}

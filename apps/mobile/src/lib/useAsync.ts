import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, describeError } from './api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  reload: () => Promise<void>;
  setData: (updater: (prev: T | null) => T | null) => void;
}

/** Minimal data hook with loading / error / offline states and manual reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fnRef.current();
      setData(d);
      setOffline(false);
    } catch (err) {
      setOffline(err instanceof ApiError && err.code === 'NETWORK');
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void reload(), deps);
  return { data, loading, error, offline, reload, setData: (u) => setData((p) => u(p)) };
}

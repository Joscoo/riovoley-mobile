/**
 * Custom hooks for common use cases
 */

import { useEffect, useState } from 'react';

export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  return { loading, setLoading };
};

export const useRefresh = (callback: () => void | Promise<void>, deps: any[] = []) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await callback();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Call on mount
    const callAsync = async () => {
      setRefreshing(true);
      try {
        await callback();
      } finally {
        setRefreshing(false);
      }
    };

    callAsync();
  }, deps);

  return { refreshing, onRefresh };
};

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

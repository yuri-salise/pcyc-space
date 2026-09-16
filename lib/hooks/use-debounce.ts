import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. search input).
 * Follows Ponytail minimalism: native setTimeout/clearTimeout, zero dependencies.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to delay before updating the debounced value (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

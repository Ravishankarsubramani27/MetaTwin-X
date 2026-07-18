/**
 * useLocalStorage.js
 * Typed localStorage hook with JSON serialisation and SSR safety.
 */
import { useState, useCallback } from "react";

export default function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const toStore = value instanceof Function ? value(stored) : value;
      setStored(toStore);
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (e) {
      console.warn(`useLocalStorage: could not save "${key}"`, e);
    }
  }, [key, stored]);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStored(initialValue);
    } catch {}
  }, [key, initialValue]);

  return [stored, setValue, removeValue];
}

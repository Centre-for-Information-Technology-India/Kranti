import { useEffect, useCallback, useRef } from "react";
import type { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";

const DEBOUNCE_MS = 500;

export function useFormAutoSave<T extends FieldValues>(
  form: UseFormReturn<T>,
  storageKey: string
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<T>;
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          const field = key as Path<T>;
          form.setValue(field, value as PathValue<T, Path<T>>, { shouldValidate: false });
        }
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch all fields and debounce save
  const values = form.watch();

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {}
    }, DEBOUNCE_MS);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [values, storageKey]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  return { clear };
}

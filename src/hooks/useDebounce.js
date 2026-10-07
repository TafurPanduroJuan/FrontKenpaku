import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor (útil en campos de búsqueda).
 * @param {any} value 
 * @param {number} delay Tiempo en milisegundos (por defecto 300ms)
 * @returns {any}
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

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

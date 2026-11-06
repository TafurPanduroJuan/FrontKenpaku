import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Imagen estándar de producto: llena su contenedor, nunca se recorta
 * (object-contain) y muestra un marcador si la URL falla o no existe.
 * El contenedor padre define el tamaño (ej. aspect-[4/3] o w-16 h-16).
 */
export function ProductImage({ src, alt, className = '', fallbackClassName = '', padding = 'p-3' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400 ${fallbackClassName}`}
        role="img"
        aria-label={alt || 'Sin imagen'}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-contain object-center bg-white ${padding} ${className}`}
    />
  );
}
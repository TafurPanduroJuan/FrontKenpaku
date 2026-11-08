import React, { useEffect, useState } from 'react';

/**
 * Ilustración isométrica de perfiles de acero (backup de figma-referencia si no hay imagen_url)
 */
const circle = (cx, cy, r, n = 28) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 6.2832), cy + r * Math.sin((i / n) * 6.2832)]);
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

const SHAPES = {
  angle: { pts: [[0, 0], [11, 0], [11, 49], [60, 49], [60, 60], [0, 60]], e: [110, -42] },
  channel: { pts: [[0, 0], [40, 0], [40, 9], [9, 9], [9, 51], [40, 51], [40, 60], [0, 60]], e: [110, -42] },
  square: { pts: rect(0, 0, 50, 50), hole: rect(7, 7, 36, 36), e: [110, -42] },
  rect: { pts: rect(0, 0, 70, 38), hole: rect(7, 7, 56, 24), e: [105, -40] },
  round: { pts: circle(28, 28, 28), hole: circle(28, 28, 21), e: [110, -42] },
  plate: { pts: rect(0, 0, 100, 7), e: [50, -48] },
  rebar: { pts: circle(9, 9, 9, 16), e: [140, -52] },
  acc: { pts: circle(30, 30, 30, 6), hole: circle(30, 30, 12, 18), e: [14, -6] },
};

function SteelArt({ kind = 'round', finish = 'Negro', className = '' }) {
  const shape = SHAPES[kind] || SHAPES.round;
  const { pts, hole, e } = shape;
  const gal = finish === 'Galvanizado';
  const tone = (l) => (gal ? `hsl(212 16% ${58 + l * 34}%)` : finish === 'Sin acabado' ? `hsl(25 8% ${34 + l * 32}%)` : `hsl(215 14% ${14 + l * 34}%)`);
  const all = [...pts, ...pts.map((p) => [p[0] + e[0], p[1] + e[1]])];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const pad = 8, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const W = Math.max(...xs) + pad - minX, H = Math.max(...ys) + pad - minY;
  const faces = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
    const n = [dy / len, -dx / len];
    return { p, q, n, vis: n[0] * e[0] + n[1] * e[1] > 0.01 };
  }).filter((f) => f.vis);
  const d = (poly) => 'M' + poly.map((p) => p.join(',')).join('L') + 'Z';
  const id = `g_${kind}_${finish}`.replace(/\s+/g, '_');

  return (
    <svg viewBox={`${minX} ${minY} ${W} ${H}`} className={className} role="img" aria-label={`${kind} ${finish}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone(0.85)} />
          <stop offset="1" stopColor={tone(0.45)} />
        </linearGradient>
      </defs>
      <ellipse cx={minX + W / 2} cy={minY + H - 4} rx={W * 0.4} ry={3.5} fill="#0b1a33" opacity={0.12} />
      {faces.map((f, i) => {
        const poly = [f.p, f.q, [f.q[0] + e[0], f.q[1] + e[1]], [f.p[0] + e[0], f.p[1] + e[1]]];
        const light = Math.max(0, Math.min(1, 0.5 - f.n[1] * 0.45 - f.n[0] * 0.1));
        return <path key={i} d={d(poly)} fill={tone(light)} stroke={tone(light * 0.7)} strokeWidth={0.3} />;
      })}
      <path d={d(pts) + (hole ? d(hole) : '')} fillRule="evenodd" fill={`url(#${id})`} stroke={tone(0.15)} strokeWidth={0.5} />
      {hole && <path d={d(hole)} fill={tone(0.02)} opacity={0.75} />}
    </svg>
  );
}

/**
 * Deduce el tipo de perfil geométrico según la categoría o nombre para el respaldo
 */
function inferSteelKind(categoria = '', nombre = '') {
  const text = `${categoria} ${nombre}`.toLowerCase();
  if (text.includes('plancha')) return 'plate';
  if (text.includes('fierro') || text.includes('corrugado')) return 'rebar';
  if (text.includes('tubo') || text.includes('redondo')) return 'round';
  if (text.includes('cuadrad')) return 'square';
  if (text.includes('rectang')) return 'rect';
  if (text.includes('angulo') || text.includes('ángulo')) return 'angle';
  if (text.includes('perfil') || text.includes('canal') || text.includes('beam')) return 'channel';
  return 'square';
}

/**
 * Imagen estándar de producto:
 * - Siempre muestra la imagen real (src/imagen_url)
 * - Si no hay imagen o falla al cargar, muestra la ilustración SteelArt como respaldo visual elegante
 */
export function ProductImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  padding = 'p-3',
  categoria = '',
  finish = 'Negro'
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    const kind = inferSteelKind(categoria, alt);
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br from-steel-100 via-steel-150 to-steel-200 overflow-hidden ${fallbackClassName}`}
        role="img"
        aria-label={alt || 'Ilustración técnica de acero'}
      >
        <div className="absolute inset-0 steel-texture opacity-30 pointer-events-none" />
        <SteelArt
          kind={kind}
          finish={finish}
          className="relative h-full w-full p-4 transition-transform duration-500 group-hover:scale-105"
        />
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

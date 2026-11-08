/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── NUEVO SISTEMA DE TOKENS (figma-referencia) ───────────────────────
        // Navy scale — oscuros de fondo (topbar, footer, drawers)
        navy: {
          950: '#070f20',  // TopBar bg (nuevo, más oscuro)
          900: '#0b1a33',  // Footer, CartDrawer header, chat bot bg
          800: '#112447',
          700: '#1a3260',  // Hero dark section, hover nav mobile
        },
        // Brand blue — acción, links, focus rings, burbuja "yo" en chat
        brand: {
          700: '#104f99',
          600: '#1565c0',  // Hover blue, íconos activos, chat bubble yo
          500: '#1f7ae0',  // Blue primario (links, focus, íconos)
          50:  '#eaf3fe',  // Fondo suave blue (badges, hover)
        },
        // Accent orange — CTA primario, filtros activos, underline nav
        accent: {
          700: '#a03d06',  // CTA hover
          600: '#c24b08',  // CTA primario (Agregar, Confirmar, Hero)
          500: '#f26a1b',  // Filtros activos, slider range fill, underline nav
          400: '#f58a4a',  // Topbar icons (MapPin, Clock)
        },
        // Steel — grises con tinte azulado (fondos, bordes, texto muted)
        steel: {
          600: '#4d5b70',  // Labels, texto secundario
          500: '#5b6a80',  // Texto muted, placeholders, íconos
          300: '#bcc7d6',  // Dashed lines, borders secundarios
          200: '#d9e0ea',  // Bordes de cards, dividers
          150: '#e3e9f1',  // Hero gradientes
          100: '#eaeef4',  // Skeleton, hover sidebar, chips
          50:  '#f5f7fa',  // App background, hover items
        },
        // WhatsApp
        wa: {
          700: '#0a6633',  // Hover WhatsApp
          600: '#0e7c3f',  // Botón WhatsApp
        },

        // ─── ALIASES kenpaku.* (COMPATIBILIDAD — no eliminar hasta Etapa 3+) ──
        // Estos alias mantienen funcionando todo el JSX existente mientras se
        // migra componente a componente en las etapas 2-6.
        kenpaku: {
          navy:         '#0b1a33',  // → navy-900 (era #0F172A, levemente más frío)
          navyLight:    '#1a3260',  // → navy-700 (era #1E293B)
          blue:         '#1f7ae0',  // → brand-500 (era #2563EB)
          blueHover:    '#1565c0',  // → brand-600 (era #1D4ED8)
          orange:       '#f26a1b',  // → accent-500 (era #F97316)
          orangeHover:  '#c24b08',  // → accent-600 (era #EA580C)
          whatsapp:     '#0e7c3f',  // → wa-600 (era #22C55E — ahora más oscuro)
          whatsappHover:'#0a6633',  // → wa-700 (era #16A34A)
          bg:           '#f5f7fa',  // → steel-50 (era #F8FAFC — idéntico visualmente)
          card:         '#FFFFFF',
          border:       '#d9e0ea',  // → steel-200 (era #E2E8F0)
          muted:        '#5b6a80',  // → steel-500 (era #64748B)
        },
      },

      fontFamily: {
        // Inter para body/UI
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        // Plus Jakarta Sans para headings, logo, precios
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Escala tipográfica del diseño de referencia
        'micro': ['11px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'title': ['15px', { lineHeight: '1.4' }],
        'price': ['26px', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'hero':  ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },

      letterSpacing: {
        'eyebrow': '0.14em',  // Labels uppercase (Footer h4, eyebrow badges)
        'kicker':  '0.12em',  // Chips de categoría en ProductCard
      },

      borderRadius: {
        // Tailwind estándar sobreescrito para sistema de redondeo del diseño
        'lg':    '0.5rem',   // 8px — heredado
        'xl':    '0.75rem',  // 12px — heredado
        '2xl':   '1rem',     // 16px — heredado
        // Nuevos tokens de forma del diseño de referencia
        'btn':   '14px',     // Botones, inputs
        'card':  '20px',     // Cards de producto, FilterSidebar
        'chat':  '22px',     // Panel del ChatWidget
        'panel': '24px',     // Formularios grandes (Checkout, Claims)
        'hero':  '28px',     // Hero card, CTA final
      },

      boxShadow: {
        // Heredados
        'soft':  '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
        // Nuevos del diseño de referencia
        'header': '0 1px 0 0 rgb(217 224 234 / 0.8), 0 4px 24px -4px rgb(15 23 42 / 0.08)',
        'card':   '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        'lift':   '0 20px 40px -8px rgb(15 23 42 / 0.18), 0 8px 16px -4px rgb(15 23 42 / 0.08)',
        'cta':    '0 4px 14px -2px rgb(194 75 8 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.15)',
        'cta-soft': '0 4px 12px -2px rgb(194 75 8 / 0.30)',
        'cta-hover': '0 8px 20px -4px rgb(194 75 8 / 0.55)',
        'wa':     '0 4px 14px -2px rgb(14 124 63 / 0.40)',
        'inset':  'inset 0 1px 3px 0 rgb(15 23 42 / 0.08)',
      },

      maxWidth: {
        'site': '1240px',  // Contenedor principal del layout
      },

      // Keyframes para las animaciones — se consumen en la sección `animation`
      keyframes: {
        // Existentes (renombradas para consistencia, alias abajo)
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        // Nuevas
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        // Bump: escala para el badge del carrito al añadir un item
        bump: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%':      { transform: 'scale(1.5)' },
        },
        // Pop: entrada del ícono de confirmación (✓ añadido al carrito)
        pop: {
          '0%':   { transform: 'scale(0.4)' },
          '70%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        // Float: movimiento lento para cards flotantes del hero
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        // Toast entrada
        toastIn: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Pulse ring para el botón flotante del chat
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgb(31 122 224 / 0.5)' },
          '70%':  { boxShadow: '0 0 0 12px rgb(31 122 224 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(31 122 224 / 0)' },
        },
        // Shimmer para skeletons
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(100%)' },
        },
        // Reveal: entrada por scroll (complementa la clase .reveal en CSS)
        revealIn: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        // Alias de las existentes (sin romper código actual)
        'fade-in':       'fadeIn 0.25s ease-out forwards',
        'slide-up':      'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        // Nuevas
        'slide-in-right':'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bump':          'bump 0.4s ease-out',
        'pop':           'pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float':         'float 6s ease-in-out infinite',
        'toast-in':      'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-ring':    'pulseRing 2.4s ease-out infinite',
        'shimmer':       'shimmer 1.6s linear infinite',
        'reveal':        'revealIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}

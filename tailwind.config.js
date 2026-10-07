/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kenpaku: {
          navy: '#0F172A',       // Dark Navy Blue (topbar, footer, titles)
          navyLight: '#1E293B',  // Navy Secondary
          blue: '#2563EB',       // Primary Blue (links, icons, user chat bubble)
          blueHover: '#1D4ED8',  // Primary Blue Hover
          orange: '#F97316',     // Action Orange (Ver catálogo, Agregar, Continuar, Registrar)
          orangeHover: '#EA580C',// Action Orange Hover
          whatsapp: '#22C55E',   // WhatsApp Green
          whatsappHover: '#16A34A',
          bg: '#F8FAFC',         // Main App Background
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}

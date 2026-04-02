import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f1f47',
          dark: '#091530',
        },
        brand: {
          blue: '#2563eb',
          'blue-lt': '#3b82f6',
          sky: '#eef3ff',
          orange: '#f97316',
          'orange-dark': '#ea6b0f',
          lime: '#16a34a',
          'lime-lt': '#22c55e',
        },
        passit: {
          off: '#f7f9fe',
          muted: '#64748b',
          light: '#94a3b8',
          border: '#e1e8f5',
          text: '#0f172a',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'brand-sm': '0 4px 24px rgba(37,99,235,0.10)',
        'brand-md': '0 12px 48px rgba(37,99,235,0.16)',
        'orange-sm': '0 2px 10px rgba(249,115,22,0.32)',
        'orange-md': '0 4px 18px rgba(249,115,22,0.40)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'float': 'float 4s ease-in-out infinite',
        'pulse-dot': 'pulseDot 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

/** @type {import('tailwindcss').Config} */
module.exports = {
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
          border: '#e1e8f5',
          muted: '#64748b',
          light: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(37,99,235,0.10)',
        'card-lg': '0 12px 48px rgba(37,99,235,0.16)',
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
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.5', transform: 'scale(1.3)' },
        },
        barGrow: {
          from: { width: '0 !important' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'fade-up-1': 'fadeUp 0.5s 0.1s ease both',
        'fade-up-2': 'fadeUp 0.5s 0.2s ease both',
        'fade-up-3': 'fadeUp 0.5s 0.3s ease both',
        float: 'float 4s ease-in-out infinite',
        'float-delay': 'float 4s 1.5s ease-in-out infinite',
        'dot-pulse': 'pulse 1.5s infinite',
      },
    },
  },
  plugins: [],
}

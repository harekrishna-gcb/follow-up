/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // One calm saffron accent (#F97316)
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.05)',
        float: '0 12px 28px -8px rgb(234 88 12 / 0.55)',
        sheet: '0 -8px 30px rgb(15 23 42 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'rise-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        bump: { '0%,100%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.18)' } },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out',
        'pop-in': 'pop-in .18s ease-out',
        'rise-in': 'rise-in .25s ease-out both',
        shimmer: 'shimmer 1.4s infinite',
        bump: 'bump .28s ease-out',
      },
    },
  },
  plugins: [],
};

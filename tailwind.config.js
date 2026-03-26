/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#eef2f7',
          100: '#d5e0ed',
          200: '#abc1db',
          300: '#7599be',
          400: '#4a72a0',
          500: '#1a5276',
          600: '#154464',
          700: '#103552',
          800: '#0b2640',
          900: '#06192e',
        },
      },
      keyframes: {
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'modal-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up':   'slide-up 0.35s ease forwards',
        'modal-in':   'modal-in 0.25s ease forwards',
        'slide-down': 'slide-down 0.3s ease forwards',
        'fade-in':    'fade-in 0.45s ease forwards',
      },
    },
  },
  plugins: [],
}
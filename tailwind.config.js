/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [],
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(60px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)'      },
        },
        'fade-scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1'   },
          '50%':      { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.35s ease forwards',
        'slide-down':    'slide-down 0.3s ease forwards',
        'slide-up':      'slide-up 0.35s ease forwards',
        'slide-in-right':'slide-in-right 0.4s ease forwards',
        'modal-in':      'modal-in 0.25s ease forwards',
        'fade-scale-in': 'fade-scale-in 0.3s ease forwards',
        'pulse-soft':    'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
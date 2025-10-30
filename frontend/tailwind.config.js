/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Classes de bordure pour toutes les couleurs et intensités utilisées dans le programme
    'border-blue-200', 'border-blue-300', 'border-blue-400', 'border-blue-500',
    'border-red-200', 'border-red-300', 'border-red-400', 'border-red-500',
    'border-green-200', 'border-green-300', 'border-green-400', 'border-green-500',
    'border-yellow-200', 'border-yellow-300', 'border-yellow-400', 'border-yellow-500',
    'border-purple-200', 'border-purple-300', 'border-purple-400', 'border-purple-500',
    'border-pink-200', 'border-pink-300', 'border-pink-400', 'border-pink-500',
    'border-indigo-200', 'border-indigo-300', 'border-indigo-400', 'border-indigo-500',
    'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500',
    // Classes de background pour les soulignements animés
    'bg-blue-400', 'bg-blue-500',
    'bg-red-400', 'bg-red-500',
    'bg-green-400', 'bg-green-500',
    'bg-yellow-400', 'bg-yellow-500',
    'bg-purple-400', 'bg-purple-500',
    'bg-pink-400', 'bg-pink-500',
    'bg-indigo-400', 'bg-indigo-500',
    'bg-gray-400', 'bg-gray-500',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'toast-in': 'toastIn 0.3s ease-out',
        'toast-out': 'toastOut 0.2s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        toastIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        toastOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}

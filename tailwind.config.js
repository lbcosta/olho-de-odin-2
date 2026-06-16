// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Identidade "desktop moderna" (tema escuro por padrão).
        surface: {
          DEFAULT: '#0f1115',
          raised: '#171a21',
          overlay: '#1f242e',
          border: '#2a2f3a',
        },
        odin: {
          // Acento âmbar/dourado (o "Olho de Odin").
          50: '#fff8e6',
          100: '#ffedbf',
          200: '#ffdd85',
          300: '#ffc94d',
          400: '#f7b733',
          500: '#e09e1f',
          600: '#b87d15',
          700: '#8a5c10',
        },
        // Cores semânticas do Request Log (spec: 0003-Visao Expandida).
        log: {
          success: '#22c55e', // 200 OK   -> bg-green-500
          error: '#ef4444', // 429/Erro -> bg-red-500
          pending: '#9ca3af', // Na fila  -> bg-gray-400
          progress: '#eab308', // Em curso -> bg-yellow-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

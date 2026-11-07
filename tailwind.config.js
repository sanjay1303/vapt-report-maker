/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        sidebar: {
          bg: '#1c1730',
          hover: '#292243',
          active: '#7c3aed',
          text: '#94a3b8',
          textActive: '#ffffff',
          border: '#2a2245',
        },
        severity: {
          critical: '#991b1b',
          'critical-bg': '#fee2e2',
          high: '#dc2626',
          'high-bg': '#fef2f2',
          medium: '#d97706',
          'medium-bg': '#fef3c7',
          low: '#16a34a',
          'low-bg': '#dcfce7',
          info: '#2563eb',
          'info-bg': '#dbeafe',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}


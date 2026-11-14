/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ps: {
          navy: '#0c324e',
          'navy-dark': '#002137',
          'navy-deep': '#081e30',
          'navy-light': '#14466b',
          'navy-hover': '#1b5580',
          green: '#00d084',
          'green-neon': '#00ff66',
          'green-dark': '#1B8415',
          'green-light': '#28C76F',
          red: '#cf2e2e',
          'red-light': '#ef4444',
          slate: '#334155',
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(12, 50, 78, 0.05), 0 4px 6px -2px rgba(12, 50, 78, 0.03)',
        'card': '0 10px 25px -5px rgba(12, 50, 78, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'elevated': '0 20px 35px -10px rgba(12, 50, 78, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'glow-green': '0 0 25px rgba(0, 208, 132, 0.3)',
      }
    },
  },
  plugins: [],
}

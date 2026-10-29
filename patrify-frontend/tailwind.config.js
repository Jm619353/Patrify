/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf4ff',
          100: '#f6e7ff',
          200: '#eed1ff',
          300: '#e2a9fe',
          400: '#d376fc',
          500: '#bd42f3',
          600: '#a422d7',
          700: '#8a19b2',
          800: '#721692',
          900: '#611877',
          950: '#3d0250'
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 45px -30px rgba(15, 23, 42, 0.35)',
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 30px -24px rgba(15, 23, 42, 0.25)'
      }
    }
  },
  plugins: []
};

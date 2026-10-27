/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],  
  theme: {
    extend: {
      colors: {
        'french-lilac': {
          '50': '#fbf4ff',
          '100': '#f6e7ff',
          '200': '#eed1ff',
          '300': '#e2a9fe',
          '400': '#d376fc',
          '500': '#bd42f3',
          '600': '#a422d7',
          '700': '#8a19b2',
          '800': '#721692',
          '900': '#611877',
          '950': '#3d0250',
        },
      },
    },
  },
  plugins: [],
}


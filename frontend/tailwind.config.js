/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#161B22',
          soft: '#3A4150',
        },
        paper: '#FAF9F6',
        line: '#E4E1D6',
        bazaar: {
          50: '#EAF2EE',
          100: '#CFE2D8',
          400: '#3C8367',
          500: '#1F5C4D',
          600: '#164438',
          700: '#0F332A',
        },
        mustard: {
          100: '#F6E6BF',
          400: '#D9A441',
          500: '#C08A28',
        },
        clay: {
          400: '#C05B3E',
          500: '#A5462C',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};

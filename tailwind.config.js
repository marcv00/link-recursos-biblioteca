/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ulima: {
          orange: '#EE5A24',
          'orange-dark': '#D8481A',
          ink: '#1A1A1A',
          slate: '#4A4F55',
          line: '#E4E4E4',
          bg: '#FAFAFA',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Helvetica Neue',
          'Arial',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      maxWidth: {
        shell: '1600px',
      },
    },
  },
  plugins: [],
};

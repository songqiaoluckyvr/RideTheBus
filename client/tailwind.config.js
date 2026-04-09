/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#1a4731',
          dark: '#0f2d1e',
          light: '#235c3e',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f0d060',
          dark: '#a8892a',
        },
        card: {
          bg: '#f5f0e8',
          border: '#d4c4a0',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [],
}

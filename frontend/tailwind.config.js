/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        doom: {
          bearish: '#ef4444',
          bullish: '#22c55e',
          mixed: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

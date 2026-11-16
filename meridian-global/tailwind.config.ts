import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral ink shades tinted towards the brand blue (text, borders, soft backgrounds)
        navy: {
          50: '#f5f8ff', 100: '#e8eefc', 200: '#cdd8f5', 300: '#b3c2ee', 400: '#5f74b8',
          500: '#45589a', 600: '#2f3f7c', 700: '#1f2d63', 800: '#14204f', 900: '#0b1640', 950: '#060d2b',
        },
        // Brand blue. 500 is the brand colour #0530AD.
        brand: {
          50: '#eef3ff', 100: '#dbe5ff', 200: '#c9d6ff', 300: '#a9bfff', 400: '#5079ee',
          500: '#0530AD', 600: '#04278f', 700: '#031e70',
        },
      },
      fontFamily: {
        display: ['"Times New Roman"', 'Times', 'serif'],
        sans: ['"Times New Roman"', 'Times', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,22,41,.05), 0 8px 24px -12px rgba(10,22,41,.18)',
      },
    },
  },
  plugins: [],
};

export default config;

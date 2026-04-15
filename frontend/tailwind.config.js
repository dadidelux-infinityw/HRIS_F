/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map blue/indigo variations to NU Navy
        blue: {
          50: '#eaebf4',
          100: '#cacee4',
          200: '#a7abcd',
          300: '#7f85b3',
          400: '#5c619b',
          500: '#4b58ad',
          600: '#35408e', // NU Navy Base
          700: '#2d377b',
          800: '#232b61',
          900: '#111534',
        },
        indigo: {
          50: '#eaebf4',
          100: '#cacee4',
          200: '#a7abcd',
          300: '#7f85b3',
          400: '#5c619b',
          500: '#4b58ad',
          600: '#35408e', // NU Navy Base
          700: '#2d377b',
          800: '#232b61',
          900: '#111534',
        },
        sky: {
          50: '#eaebf4',
          100: '#cacee4',
          200: '#a7abcd',
          300: '#7f85b3',
          400: '#5c619b',
          500: '#4b58ad',
          600: '#35408e', // NU Navy Base
          700: '#2d377b',
          800: '#232b61',
          900: '#111534',
        },
        cyan: {
          50: '#eaebf4',
          100: '#cacee4',
          200: '#a7abcd',
          300: '#7f85b3',
          400: '#5c619b',
          500: '#4b58ad',
          600: '#35408e', // NU Navy Base
          700: '#2d377b',
          800: '#232b61',
          900: '#111534',
        },
        // Map yellow/orange/gold variations to NU Gold
        yellow: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe895',
          300: '#ffdc61',
          400: '#ffd033',
          500: '#fac213', 
          600: '#f1b500', // NU Gold Base
          700: '#d9a30d',
          800: '#b38407',
          900: '#6b4b02',
        },
        orange: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe895',
          300: '#ffdc61',
          400: '#ffd033',
          500: '#fac213',
          600: '#f1b500', // NU Gold Base
          700: '#d9a30d',
          800: '#b38407',
          900: '#6b4b02',
        },
        purple: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe895',
          300: '#ffdc61',
          400: '#ffd033',
          500: '#fac213',
          600: '#f1b500', // NU Gold Base
          700: '#d9a30d',
          800: '#b38407',
          900: '#6b4b02',
        },
        pink: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe895',
          300: '#ffdc61',
          400: '#ffd033',
          500: '#fac213',
          600: '#f1b500', // NU Gold Base
          700: '#d9a30d',
          800: '#b38407',
          900: '#6b4b02',
        },
        green: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe895',
          300: '#ffdc61',
          400: '#ffd033',
          500: '#fac213',
          600: '#f1b500', // NU Gold Base
          700: '#d9a30d',
          800: '#b38407',
          900: '#6b4b02',
        },
        primary: {
          50: '#eaebf4',
          100: '#cacee4',
          200: '#a7abcd',
          300: '#7f85b3',
          400: '#5c619b',
          500: '#4b58ad',
          600: '#35408e', // NU Navy Base
          700: '#2d377b',
          800: '#232b61',
          900: '#111534',
        },
      },
    },
  },
  plugins: [],
}

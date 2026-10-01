/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#05070a',
          900: '#07090e',
          850: '#0b0f19',
          800: '#101626',
          700: '#172036',
          600: '#222f4c',
        },
        m3: {
          surface: '#111318',
          'surface-dim': '#0e1116',
          'surface-container-lowest': '#0c0e12',
          'surface-container-low': '#161922',
          'surface-container': '#1a1e28',
          'surface-container-high': '#212634',
          'surface-container-highest': '#282e3f',
          primary: '#6cdb9f',
          'on-primary': '#003822',
          'primary-container': '#005234',
          'on-primary-container': '#8af8ba',
          secondary: '#b3ccbd',
          'secondary-container': '#354b3e',
          'on-secondary-container': '#cee8d8',
          tertiary: '#a5cdd9',
          'tertiary-container': '#234a54',
          'on-tertiary-container': '#c0e9f6',
          error: '#ffb4ab',
          'error-container': '#93000a',
          'on-surface': '#e2e2e9',
          'on-surface-variant': '#c4c6d0',
          outline: '#8e9099',
          'outline-variant': '#44474f',
        },
        flux: {
          cyan: '#00f0ff',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
        }
      },
      fontFamily: {
        repose: ['"The Seasons"', '"Bodoni Moda"', '"Playfair Display"', '"Prata"', 'Georgia', 'serif'],
        seasons: ['"The Seasons"', '"Bodoni Moda"', '"Playfair Display"', '"Prata"', 'Georgia', 'serif'],
        serif: ['"The Seasons"', '"Bodoni Moda"', '"Playfair Display"', '"Prata"', 'Georgia', 'serif'],
        editorial: ['"The Seasons"', '"Bodoni Moda"', '"Playfair Display"', '"Prata"', 'Georgia', 'serif'],
        luxury: ['"The Seasons"', '"Bodoni Moda"', '"Playfair Display"', '"Prata"', 'Georgia', 'serif'],
        bodoni: ['"Bodoni Moda"', 'serif'],
        playfair: ['"Playfair Display"', 'serif'],
        prata: ['"Prata"', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['"The Seasons"', '"Bodoni Moda"', 'Syne', 'Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}

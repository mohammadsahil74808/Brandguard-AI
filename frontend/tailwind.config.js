/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FBF8F3', // Warm Retro Cream from reference
        surface: '#FFFFFF',
        ink: '#121212', // Pure high-contrast black
        inkMuted: '#525252',
        cream: {
          50: '#FDFBF7',
          100: '#FBF8F3',
          200: '#F5EFE6',
          300: '#EDE4D5',
        },
        crimson: {
          DEFAULT: '#C50337', // User signature crimson
          pop: '#E02B48',
          light: '#FFEAEF',
          dark: '#8A0225',
          50: '#FFF0F3',
          100: '#FFE0E6',
          500: '#E02B48',
          600: '#C50337',
          700: '#9E022B',
        },
        brand: {
          DEFAULT: '#C50337',
          50: '#FFF0F3',
          500: '#E02B48',
          600: '#C50337',
          700: '#9E022B',
        },
        popYellow: {
          DEFAULT: '#FFDE59',
          light: '#FFF5C2',
          dark: '#E5C029',
        },
        popGreen: {
          DEFAULT: '#00D26A',
          light: '#DCFCE7',
          dark: '#059669',
        },
        popBlue: {
          DEFAULT: '#38BDF8',
          light: '#E0F2FE',
          dark: '#0284C7',
        },
        popCoral: {
          DEFAULT: '#FF6B6B',
          light: '#FFE5E5',
          dark: '#E04848',
        },
        popPurple: {
          DEFAULT: '#A78BFA',
          light: '#EDE9FE',
          dark: '#7C3AED',
        },
        risk: {
          low: '#00D26A',
          medium: '#FFB800',
          high: '#FF8800',
          critical: '#C50337',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #121212',
        'brutal': '4px 4px 0px 0px #121212',
        'brutal-lg': '6px 6px 0px 0px #121212',
        'brutal-xl': '8px 8px 0px 0px #121212',
        'brutal-crimson': '4px 4px 0px 0px #C50337',
        'brutal-yellow': '4px 4px 0px 0px #FFDE59',
        'brutal-green': '4px 4px 0px 0px #00D26A',
      }
    },
  },
  plugins: [],
}

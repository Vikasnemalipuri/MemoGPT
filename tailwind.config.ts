/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d0ff',
          300: '#9db3ff',
          400: '#7c8fff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          800: '#1e2433',
          850: '#171d2c',
          900: '#111827',
          950: '#0a0e1a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 1s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      boxShadow: {
        'glass': '0 4px 24px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.06)',
        'glass-lg': '0 8px 40px -4px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.06)',
        'brand': '0 0 20px rgba(99, 102, 241, 0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
  safelist: [
    // Arbitrary opacity classes used across components
    { pattern: /bg-(white|black)\/(4|5|8|10|12|15|20|25|30)/ },
    { pattern: /border-(white|black)\/(4|5|8|10|12|15|20)/ },
    { pattern: /text-(white|black)\/(4|5|8|10|12|15|20)/ },
    { pattern: /ring-(brand|white|black)-(500|600)\/(20|30|50)/ },
    { pattern: /bg-(brand|purple|green|red|emerald)-(500|600|700|950)\/(10|15|20|25|30|60)/ },
    { pattern: /border-(brand|purple|green|red)-(500|600|700)\/(20|30)/ },
    { pattern: /text-(brand|green|red)-(300|400|500)\/(20|30)/ },
  ],
}


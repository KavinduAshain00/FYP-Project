/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: 'rgb(var(--color-blue-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--color-blue-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--color-blue-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-blue-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--color-blue-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-blue-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-blue-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-blue-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--color-blue-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--color-blue-900-rgb) / <alpha-value>)',
          950: 'rgb(var(--color-blue-950-rgb) / <alpha-value>)',
        },

        'neon-cyan': 'rgb(var(--color-blue-400-rgb) / <alpha-value>)',
        'neon-purple': 'rgb(var(--color-blue-500-rgb) / <alpha-value>)',
        'neon-pink': 'rgb(var(--color-blue-300-rgb) / <alpha-value>)',
        'neon-gold': 'rgb(var(--color-warm-rgb) / <alpha-value>)',
        'neon-green': 'rgb(var(--color-success-rgb) / <alpha-value>)',
        'neon-orange': 'rgb(var(--color-orange-accent-rgb) / <alpha-value>)',
        'neon-blue': 'rgb(var(--color-blue-400-rgb) / <alpha-value>)',

        'hp-red': 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        'mp-blue': 'rgb(var(--color-blue-400-rgb) / <alpha-value>)',
        'xp-gold': 'rgb(var(--color-warm-rgb) / <alpha-value>)',
        'shield-purple': 'rgb(var(--color-blue-500-rgb) / <alpha-value>)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at 1px 1px, rgb(var(--color-blue-400-rgb) / 0.07) 1px, transparent 0)',
        'cyber-grid':
          'linear-gradient(rgb(var(--color-blue-400-rgb) / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-blue-400-rgb) / 0.04) 1px, transparent 1px)',
        panel: 'none',
        'gradient-radial': 'none',
        'gradient-conic': 'none',
        'neon-glow': 'none',
        'purple-glow': 'none',
        'gold-glow': 'none',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'soft-pulse 2s ease-in-out infinite',
        gradient: 'none',
        'slide-up': 'slideUp 0.5s ease forwards',
        'slide-down': 'slideDown 0.5s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        heartbeat: 'heartbeat 1.5s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(100px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      fontFamily: {
        game: ["'Press Start 2P'", 'cursive'],
        display: ["'Orbitron'", 'sans-serif'],
        body: ["'Inter'", "'Segoe UI'", 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        game: '0.75rem',
        'game-lg': '1rem',
        'game-xl': '1.25rem',
      },
      transitionTimingFunction: {
        game: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'game-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};

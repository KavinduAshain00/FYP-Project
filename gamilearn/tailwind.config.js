/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "game-void": "#0d1017",
        "game-abyss": "#111621",
        "game-night": "#171c2a",
        "game-dusk": "#1e2536",
        "game-steel": "#2a3248",

        "neon-cyan": "#4e9a8e",
        "neon-purple": "#8070b0",
        "neon-pink": "#b06070",
        "neon-gold": "#c8a040",
        "neon-green": "#5c9650",
        "neon-orange": "#b87038",
        "neon-blue": "#5878a8",

        "hp-red": "#c04848",
        "mp-blue": "#4878a8",
        "xp-gold": "#c8a040",
        "shield-purple": "#706898",
      },
      boxShadow: {
        "glow-cyan": "0 2px 8px rgba(78,154,142,0.15)",
        "glow-purple": "0 2px 8px rgba(128,112,176,0.15)",
        "glow-pink": "0 2px 8px rgba(176,96,112,0.15)",
        "glow-gold": "0 2px 8px rgba(200,160,64,0.15)",
        "glow-green": "0 2px 8px rgba(92,150,80,0.15)",
        "glow-red": "0 2px 8px rgba(192,72,72,0.15)",
        "neon-border": "0 1px 4px rgba(0,0,0,0.2)",
        "game-card": "0 2px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(78,154,142,0.06) 1px, transparent 0)",
        "cyber-grid": "linear-gradient(rgba(78,154,142,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(78,154,142,0.02) 1px, transparent 1px)",
        "panel": "none",
        "gradient-radial": "none",
        "gradient-conic": "none",
        "neon-glow": "none",
        "purple-glow": "none",
        "gold-glow": "none",
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow-pulse": "soft-pulse 2s ease-in-out infinite",
        "gradient": "none",
        "slide-up": "slideUp 0.5s ease forwards",
        "slide-down": "slideDown 0.5s ease forwards",
        "slide-in": "slideIn 0.3s ease forwards",
        "scale-in": "scaleIn 0.3s ease forwards",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(100px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      fontFamily: {
        game: ["'Press Start 2P'", "cursive"],
        display: ["'Orbitron'", "sans-serif"],
        body: ["'Inter'", "'Segoe UI'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "game": "0.75rem",
        "game-lg": "1rem",
        "game-xl": "1.25rem",
      },
      transitionTimingFunction: {
        "game": "cubic-bezier(0.4, 0, 0.2, 1)",
        "game-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};

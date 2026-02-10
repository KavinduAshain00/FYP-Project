/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core Gaming Colors
        "game-void": "#05080f",
        "game-abyss": "#0a0e1a",
        "game-night": "#0f1629",
        "game-dusk": "#1a1f35",
        "game-steel": "#2a3050",
        
        // Neon Accent Colors
        "neon-cyan": "#00f5ff",
        "neon-purple": "#b94fff",
        "neon-pink": "#ff2d95",
        "neon-gold": "#ffd700",
        "neon-green": "#00ff88",
        "neon-orange": "#ff6b35",
        "neon-blue": "#4d7cff",
        
        // Status Colors
        "hp-red": "#ff3d3d",
        "mp-blue": "#3d9dff",
        "xp-gold": "#ffcc00",
        "shield-purple": "#9d4edd",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.3)",
        "glow-purple": "0 0 20px rgba(185, 79, 255, 0.5), 0 0 40px rgba(185, 79, 255, 0.3)",
        "glow-pink": "0 0 20px rgba(255, 45, 149, 0.5), 0 0 40px rgba(255, 45, 149, 0.3)",
        "glow-gold": "0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)",
        "glow-green": "0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)",
        "glow-red": "0 0 20px rgba(255, 61, 61, 0.5), 0 0 40px rgba(255, 61, 61, 0.3)",
        "neon-border": "inset 0 0 20px rgba(0, 245, 255, 0.1), 0 0 20px rgba(0, 245, 255, 0.2)",
        "game-card": "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 245, 255, 0.1)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(0, 245, 255, 0.15) 1px, transparent 0)",
        "cyber-grid": "linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px)",
        "panel": "linear-gradient(135deg, rgba(15, 22, 41, 0.9) 0%, rgba(10, 14, 26, 0.95) 100%)",
        "gradient-radial": "radial-gradient(circle at center, var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "neon-glow": "radial-gradient(circle at top, rgba(0, 245, 255, 0.15), transparent 50%)",
        "purple-glow": "radial-gradient(circle at top, rgba(185, 79, 255, 0.15), transparent 50%)",
        "gold-glow": "radial-gradient(circle at top, rgba(255, 215, 0, 0.15), transparent 50%)",
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "gradient": "gradient-rotate 3s ease infinite",
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
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 245, 255, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 245, 255, 0.8)" },
        },
        "gradient-rotate": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
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
        "game": "1rem",
        "game-lg": "1.5rem",
        "game-xl": "2rem",
      },
      transitionTimingFunction: {
        "game": "cubic-bezier(0.4, 0, 0.2, 1)",
        "game-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};

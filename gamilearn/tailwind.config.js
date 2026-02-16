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
    },
  },
  plugins: [],
};

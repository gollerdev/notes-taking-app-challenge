import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#faf1e3",
        brand: "#957139",
        heading: "#88642a",
        "note-random": "rgba(239,156,102,0.5)",
        "note-school": "rgba(252,220,148,0.5)",
        "note-personal": "rgba(120,171,168,0.5)",
        "border-random": "#ef9c66",
        "border-school": "#fcdc94",
        "border-personal": "#78aba8",
        "dot-random": "#ef9c66",
        "dot-school": "#fcdc94",
        "dot-personal": "#78aba8",
      },
      fontFamily: {
        serif: ["var(--font-inria-serif)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

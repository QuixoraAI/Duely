/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#EFEBE1",
        paperDim: "#E2DCCB",
        ink: "#12233F",
        forest: "#12233F",
        forestDeep: "#0B1830",
        moss: "#3F6B52",
        gold: "#A9812E",
        goldBright: "#C79A3E",
        risk: "#B23A2E",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

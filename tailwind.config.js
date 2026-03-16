/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './js/**/*.js'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#13a4ec",
        "admin-primary": "#c9a962",
        "admin-accent": "#2a9d8f",
        "admin-bg": "#f8f6f3",
        "admin-sidebar": "#fdfcfa",
        "background-light": "#f6f7f8",
        "background-dark": "#0d1117",
        "surface-light": "#ffffff",
        "surface-dark": "#161b22",
        "text-main-light": "#0d171b",
        "text-main-dark": "#f0f6fc",
        "text-sub-light": "#4c809a",
        "text-sub-dark": "#8b949e",
        "border-light": "#cfdfe7",
        "border-dark": "#30363d",
        "groomer-primary": "#2a7a77",
        "tech-purple": "#8b5cf6",
        "tech-magenta": "#d946ef",
        "groomer-bg": "#f9f7f6",
        "groomer-dark": "#1a1d23",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}

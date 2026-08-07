/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Verde principal da marca Verdog
        verdog: {
          DEFAULT: "#1F7A3D",
          light: "#EAF3DE",
          pale: "#EFF5EC",
          dark: "#173404",
        },
      },
    },
  },
  plugins: [],
};

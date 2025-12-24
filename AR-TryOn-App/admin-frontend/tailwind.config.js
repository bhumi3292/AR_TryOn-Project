export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
  extend: {
    colors: {
      gold: {
        50: "#fff8e1",
        200: "#f5d98b",
        500: "#c9a34a",
      },
    },
    fontFamily: {
      elegant: ["Playfair Display", "serif"],
      geist: ["Geist", "Geist Fallback", "sans-serif"],
    },
    borderRadius: {
      lg: '0.75rem'
    }
  },
},

  plugins: [],
}

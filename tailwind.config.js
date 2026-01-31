module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        toxic: "#ff4d00",
        toxicSoft: "rgba(255,77,0,0.35)"
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"]
      },
      boxShadow: {
        toxic: "0 0 30px rgba(255,77,0,0.6)"
      }
    }
  },
  plugins: []
}

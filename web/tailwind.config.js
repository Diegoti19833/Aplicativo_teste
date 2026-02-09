export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: "#008037",
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,.08)'
      }
    }
  },
  plugins: []
}
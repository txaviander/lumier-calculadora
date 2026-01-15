/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lumier-gold': '#d4af37',
        'lumier-gold-light': '#f4e4bc',
        'lumier-black': '#1a1a1a',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

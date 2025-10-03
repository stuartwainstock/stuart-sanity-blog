/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Your custom color palette
        'custom': {
          '50': '#f9f9f9',
          '100': '#f0f0f0',
          '200': '#e8e8e8',  // Your current background
          '300': '#d1d1d1',
          '400': '#b8b8b8',
          '500': '#9f9f9f',
          '600': '#868686',
          '700': '#6d6d6d',
          '800': '#545454',
          '900': '#3b3b3b',
        },
        // Or single custom colors
        'page-bg': '#e8e8e8',
        'section-bg': '#f5f5f5',
        'card-bg': '#ffffff',
      },
      fontFamily: {
        'work-sans': ['Work Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

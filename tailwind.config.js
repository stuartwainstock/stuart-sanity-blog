/** @type {import('tailwindcss').Config} */
/** Colors reference CSS variables from `src/styles/generated/tokens.css` (see tokens/*.json + `npm run tokens:build`). */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        custom: {
          50: 'var(--color-custom-50)',
          100: 'var(--color-custom-100)',
          200: 'var(--color-custom-200)',
          300: 'var(--color-custom-300)',
          400: 'var(--color-custom-400)',
          500: 'var(--color-custom-500)',
          600: 'var(--color-custom-600)',
          700: 'var(--color-custom-700)',
          800: 'var(--color-custom-800)',
          900: 'var(--color-custom-900)',
        },
        'page-bg': 'var(--color-page-bg)',
        'section-bg': 'var(--color-section-bg)',
        'card-bg': 'var(--color-card-bg)',
      },
      fontFamily: {
        'work-sans': ['var(--font-work-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

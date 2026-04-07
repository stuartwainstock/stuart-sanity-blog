import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      // Sanity Studio build artifacts / generated files
      'sanity/dist/**',
      'sanity/schema.json',
      'sanity/types.ts',
    ],
  },
  // Studio UI runs outside Next; allow <img> there.
  {
    files: ['sanity/components/**/*.{ts,tsx}', 'sanity/schemaTypes/**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]

export default eslintConfig

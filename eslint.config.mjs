// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [...coreWebVitals, ...typescript, {
  ignores: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Copied MapLibre worker bundle (postinstall)
    'public/maplibre-gl-csp-worker.js',
    // Sanity Studio build artifacts / generated files
    'sanity/dist/**',
    'sanity/schema.json',
    'sanity/types.ts',
  ],
}, // Studio UI runs outside Next; allow <img> there.
{
  files: ['sanity/components/**/*.{ts,tsx}', 'sanity/schemaTypes/**/*.{ts,tsx}'],
  rules: {
    '@next/next/no-img-element': 'off',
  },
}, ...storybook.configs["flat/recommended"]]

export default eslintConfig

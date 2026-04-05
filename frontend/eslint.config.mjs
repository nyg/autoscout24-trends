import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const eslintConfig = defineConfig([
   ...nextVitals,
   {
      plugins: { 'simple-import-sort': simpleImportSort },
      rules: {
         indent: ['error', 3, { SwitchCase: 1 }],
         semi: ['error', 'never'],
         'react-hooks/exhaustive-deps': 'off',
         quotes: ['error', 'single'],
         curly: ['error', 'all'],
         'brace-style': ['error', '1tbs'],
         'no-trailing-spaces': 'error',
         'simple-import-sort/imports': 'error',
         'simple-import-sort/exports': 'error',
      }
   },
   globalIgnores([
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
   ]),
])

export default eslintConfig

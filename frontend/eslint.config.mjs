import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const eslintConfig = defineConfig([
   ...nextVitals,
   {
      plugins: { '@stylistic': stylistic, 'simple-import-sort': simpleImportSort },
      rules: {
         '@stylistic/indent': ['error', 3, { SwitchCase: 1 }],
         '@stylistic/semi': ['error', 'never'],
         'react-hooks/exhaustive-deps': 'off',
         '@stylistic/quotes': ['error', 'single'],
         curly: ['error', 'all'],
         '@stylistic/brace-style': ['error', '1tbs'],
         '@stylistic/no-trailing-spaces': 'error',
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

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
   baseDirectory: __dirname
})

const eslintConfig = [
   ...compat.extends('next/core-web-vitals'),
   {
      rules: {
         indent: ['error', 3, { SwitchCase: 1 }],
         semi: ['error', 'never'],
         'react-hooks/exhaustive-deps': 0,
         quotes: ['error', 'single']
      }
   }]

export default eslintConfig

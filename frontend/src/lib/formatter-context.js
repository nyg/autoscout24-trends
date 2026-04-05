'use client'

import { createContext, useContext, useMemo } from 'react'

import { createFormatters } from '@/lib/format'

const FormatterContext = createContext(null)

export function FormatterProvider({ locale, children }) {
   const fmt = useMemo(() => createFormatters(locale), [locale])
   return (
      <FormatterContext value={fmt}>
         {children}
      </FormatterContext>
   )
}

export function useFormatter() {
   const ctx = useContext(FormatterContext)
   if (!ctx) {
      throw new Error('useFormatter must be used within a FormatterProvider')
   }
   return ctx
}

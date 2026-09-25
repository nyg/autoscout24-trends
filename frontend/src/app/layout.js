import './globals.css'

import { Geist } from 'next/font/google'
import { headers } from 'next/headers'

import NavBar from '@/components/navbar'
import { parseAcceptLanguage, resolveNumberSymbols } from '@/lib/format'
import { FormatterProvider } from '@/lib/formatter-context'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
   title: 'AutoScout24 Trends',
}

export default async function RootLayout({ children }) {
   const hdrs = await headers()
   const locale = parseAcceptLanguage(hdrs.get('accept-language'))
   const numberSymbols = resolveNumberSymbols(locale)

   return (
      <html lang="en">
         <body className={`${geist.variable} font-sans antialiased`}>
            <FormatterProvider locale={locale} numberSymbols={numberSymbols}>
               <NavBar />
               <main className="mx-auto max-w-screen-2xl py-4">
                  {children}
               </main>
            </FormatterProvider>
         </body>
      </html>
   )
}

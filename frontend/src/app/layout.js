import { Geist } from 'next/font/google'
import NavBar from '@/components/navbar'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
   title: 'AutoScout24 Trends',
}

export default function RootLayout({ children }) {
   return (
      <html lang="en">
         <body className={`${geist.variable} font-sans antialiased`}>
            <NavBar />
            <main className="mx-auto max-w-screen-2xl py-4">
               {children}
            </main>
         </body>
      </html>
   )
}

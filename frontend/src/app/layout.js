import NavBar from '@/components/navbar'
import './globals.css'

export default function RootLayout({ children }) {
   return (
      <html lang="en">
         <body>
            <div className="prose prose-sm max-w-full">
               <NavBar />
               <div className="px-4">
                  {children}
               </div>
            </div>
         </body>
      </html>
   )
}

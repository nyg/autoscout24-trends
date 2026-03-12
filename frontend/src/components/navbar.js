import { fetchSearchNames } from '@/lib/data'
import Link from 'next/link'

export default async function NavBar() {

   const searches = await fetchSearchNames()

   return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
         <div className="mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-2">
            <Link href="/" className="text-sm font-semibold tracking-tight">
               AutoScout24 Trends
            </Link>
            <nav className="flex items-center gap-4">
               {searches.map(search => (
                  <Link
                     key={search.name}
                     href={`/${encodeURIComponent(search.name)}`}
                     className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                     {search.name}
                  </Link>
               ))}
            </nav>
            <a
               href="https://github.com/nyg/autoscout24-trends"
               target="_blank"
               rel="noopener noreferrer"
               className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
               GitHub
            </a>
         </div>
      </header>
   )
}

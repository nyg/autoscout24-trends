import { fetchSearchNames } from '@/lib/data'
import Link from 'next/link'
import { SettingsIcon, GithubIcon } from 'lucide-react'
import SearchDropdown from '@/components/search-dropdown'

export default async function NavBar() {

   const searches = await fetchSearchNames()

   return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
         <div className="mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-2">
            <Link href="/" className="text-sm font-semibold tracking-tight">
               AutoScout24 Trends
            </Link>
            <nav className="flex items-center gap-4">
               <SearchDropdown searches={searches} />
               <Link
                  href="/settings"
                  aria-label="Settings"
                  className="text-muted-foreground transition-colors hover:text-foreground"
               >
                  <SettingsIcon className="size-4" />
               </Link>
               <div className="h-4 border-l" />
               <a
                  href="https://github.com/nyg/autoscout24-trends"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open AutoScout24 Trends GitHub repository"
                  className="text-muted-foreground transition-colors hover:text-foreground"
               >
                  <GithubIcon className="size-4" />
               </a>
            </nav>
         </div>
      </header>
   )
}

import { fetchSearchNames } from '@/lib/data'
import Link from 'next/link'

export default async function NavBar() {

   const searches = await fetchSearchNames()

   return (
      <div className="navbar bg-base-300 drop-shadow px-4">
         <div className="navbar-start">
            <span className="text-lg font-semibold">AutoScout24 Trends</span>
         </div>
         <div className="navbar-center space-x-4">
            {searches.map(search => (
               <Link key={search.name} href={`/${encodeURIComponent(search.name)}`}>
                  {search.name}
               </Link>
            ))}
         </div>
         <div className="navbar-end">
            <a href="https://github.com/nyg/autoscout24-trends" target="_blank" rel="noopener noreferrer">Github</a>
         </div>
      </div>
   )
}

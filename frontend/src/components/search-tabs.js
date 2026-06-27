import Link from 'next/link'

const TABS = [
   { key: 'active', label: 'Active listings' },
   { key: 'previous', label: 'Previous listings' },
]

export default function SearchTabs({ searchName, currentTab }) {
   return (
      <nav className="flex border-b">
         {TABS.map(({ key, label }) => {
            const isActive = currentTab === key
            return (
               <Link
                  key={key}
                  href={`/search/${encodeURIComponent(searchName)}?tab=${key}`}
                  className={
                     'px-4 py-2 text-sm font-medium transition-colors ' +
                     (isActive
                        ? 'border-b-2 border-foreground text-foreground'
                        : 'text-muted-foreground hover:text-foreground')
                  }
               >
                  {label}
               </Link>
            )
         })}
      </nav>
   )
}

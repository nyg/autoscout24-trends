'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function SearchDropdown({ searches }) {

   const pathname = usePathname()
   const searchPrefix = '/search/'
   const activeSearch = pathname.startsWith(searchPrefix)
      ? decodeURIComponent(pathname.slice(searchPrefix.length))
      : null

   return (
      <DropdownMenu>
         <DropdownMenuTrigger render={<Button variant="ghost" />}>
            {activeSearch ?? 'Searches'}
            <ChevronDownIcon data-icon="inline-end" />
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            <DropdownMenuGroup>
               {searches.map(search => (
                  <DropdownMenuItem
                     key={search.name}
                     render={<Link href={`/search/${encodeURIComponent(search.name)}`} />}
                     className={activeSearch === search.name ? 'font-semibold text-foreground' : ''}
                  >
                     {search.name}
                  </DropdownMenuItem>
               ))}
            </DropdownMenuGroup>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}

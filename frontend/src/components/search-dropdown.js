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
   const activeSearch = decodeURIComponent(pathname.slice(1))

   return (
      <DropdownMenu>
         <DropdownMenuTrigger render={<Button variant="ghost" />}>
            Searches
            <ChevronDownIcon data-icon="inline-end" />
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            <DropdownMenuGroup>
               {searches.map(search => (
                  <DropdownMenuItem
                     key={search.name}
                     render={<Link href={`/${encodeURIComponent(search.name)}`} />}
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

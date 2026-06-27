'use client'

import { ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

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
   const searchParams = useSearchParams()
   const tab = searchParams.get('tab')

   const searchPrefix = '/search/'
   const activeSearch = pathname.startsWith(searchPrefix)
      ? decodeURIComponent(pathname.slice(searchPrefix.length))
      : null

   function hrefFor(name) {
      const base = `/search/${encodeURIComponent(name)}`
      return tab ? `${base}?tab=${tab}` : base
   }

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
                     render={<Link href={hrefFor(search.name)} />}
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

'use client'

import { use, useMemo, useState } from 'react'
import { createFormatters } from '@/lib/format'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
   DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
   DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CheckCircle2Icon, ChevronDownIcon, FilterIcon, XCircleIcon } from 'lucide-react'


function formatDuration(start, end) {
   if (!start || !end) {
      return '–'
   }
   const ms = new Date(end) - new Date(start)
   const totalSeconds = Math.floor(ms / 1000)
   const minutes = Math.floor(totalSeconds / 60)
   const seconds = totalSeconds % 60
   return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

function formatTime(timestamp, locale) {
   if (!timestamp) {
      return ''
   }
   const d = new Date(timestamp)
   return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}


export default function SearchRuns({ data, searches, locale }) {

   const runs = use(data)
   const searchList = use(searches)
   const [filter, setFilter] = useState(null)

   const fmt = useMemo(() => createFormatters(locale), [locale])

   const filteredRuns = useMemo(
      () => filter ? runs.filter(r => r.search_name === filter) : runs,
      [runs, filter],
   )

   return (
      <Card>
         <CardHeader>
            <CardTitle>Search Runs ({filteredRuns.length})</CardTitle>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                     <FilterIcon className="size-3.5" />
                     {filter ?? 'All searches'}
                     <ChevronDownIcon data-icon="inline-end" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuGroup>
                        <DropdownMenuItem
                           onClick={() => setFilter(null)}
                           className={!filter ? 'font-semibold' : ''}
                        >
                           All searches
                        </DropdownMenuItem>
                        {searchList.map(s => (
                           <DropdownMenuItem
                              key={s.id}
                              onClick={() => setFilter(s.name)}
                              className={filter === s.name ? 'font-semibold' : ''}
                           >
                              {s.name}
                           </DropdownMenuItem>
                        ))}
                     </DropdownMenuGroup>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>
         <CardContent className="overflow-x-auto px-0 pb-0">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Search</TableHead>
                     <TableHead className="text-right">Date</TableHead>
                     <TableHead className="text-right">Time</TableHead>
                     <TableHead className="text-right">Duration</TableHead>
                     <TableHead className="text-center">Status</TableHead>
                     <TableHead className="text-right">Cars found</TableHead>
                     <TableHead className="text-right">Cars scraped</TableHead>
                     <TableHead className="text-right">Requests</TableHead>
                     <TableHead className="text-right">Failed</TableHead>
                     <TableHead className="text-right">Reason</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filteredRuns.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                           No search runs found.
                        </TableCell>
                     </TableRow>
                  )}
                  {filteredRuns.map(run => (
                     <TableRow key={run.id} className={run.success === false ? 'bg-destructive/5' : ''}>
                        <TableCell className="whitespace-nowrap font-medium">{run.search_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{fmt.asMediumDate(run.started_at)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatTime(run.started_at, locale)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatDuration(run.started_at, run.finished_at)}</TableCell>
                        <TableCell className="text-center">
                           {run.success === true && <CheckCircle2Icon className="mx-auto size-4 text-green-600" />}
                           {run.success === false && <XCircleIcon className="mx-auto size-4 text-destructive" />}
                           {run.success == null && <span className="text-muted-foreground">–</span>}
                        </TableCell>
                        <TableCell className="text-right">{run.cars_found ?? '–'}</TableCell>
                        <TableCell className="text-right">{run.cars_scraped ?? '–'}</TableCell>
                        <TableCell className="text-right">{run.request_count ?? '–'}</TableCell>
                        <TableCell className="text-right">
                           {run.failed_request_count != null && run.failed_request_count > 0
                              ? <span className="text-destructive">{run.failed_request_count}</span>
                              : (run.failed_request_count ?? '–')
                           }
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                           {run.finish_reason ?? '–'}
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
   )
}

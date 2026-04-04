'use client'

import { use, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { asMediumDate } from '@/lib/format'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
   DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
   DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CheckCircle2Icon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon, XCircleIcon } from 'lucide-react'


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

function formatDateTime(timestamp) {
   if (!timestamp) {
      return '–'
   }
   return asMediumDate(new Date(timestamp))
}

function formatTime(timestamp) {
   if (!timestamp) {
      return ''
   }
   const d = new Date(timestamp)
   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function buildUrl(params) {
   const sp = new URLSearchParams()
   if (params.search) {
      sp.set('search', params.search)
   }
   if (params.page && params.page > 1) {
      sp.set('page', String(params.page))
   }
   const qs = sp.toString()
   return `/search-runs${qs ? `?${qs}` : ''}`
}


export default function SearchRuns({ data, searches, totalCount, page, pageSize, searchFilter }) {

   const runs = use(data)
   const searchList = use(searches)
   const total = use(totalCount)
   const router = useRouter()

   const totalPages = Math.max(1, Math.ceil(total / pageSize))

   const navigate = (params) => router.push(buildUrl(params))

   return (
      <Card>
         <CardHeader>
            <CardTitle>Search Runs ({total})</CardTitle>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                     <FilterIcon className="size-3.5" />
                     {searchFilter ?? 'All searches'}
                     <ChevronDownIcon data-icon="inline-end" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuGroup>
                        <DropdownMenuItem
                           onClick={() => navigate({ search: null, page: 1 })}
                           className={!searchFilter ? 'font-semibold' : ''}
                        >
                           All searches
                        </DropdownMenuItem>
                        {searchList.map(s => (
                           <DropdownMenuItem
                              key={s.id}
                              onClick={() => navigate({ search: s.name, page: 1 })}
                              className={searchFilter === s.name ? 'font-semibold' : ''}
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
                  {runs.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                           No search runs found.
                        </TableCell>
                     </TableRow>
                  )}
                  {runs.map(run => (
                     <TableRow key={run.id} className={run.success === false ? 'bg-destructive/5' : ''}>
                        <TableCell className="whitespace-nowrap font-medium">{run.search_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatDateTime(run.started_at)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatTime(run.started_at)}</TableCell>
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

            {/* Pagination */}
            {totalPages > 1 && (
               <div className="flex items-center justify-between border-t px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                     Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => navigate({ search: searchFilter, page: page - 1 })}
                     >
                        <ChevronLeftIcon className="size-4" />
                        Previous
                     </Button>
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => navigate({ search: searchFilter, page: page + 1 })}
                     >
                        Next
                        <ChevronRightIcon className="size-4" />
                     </Button>
                  </div>
               </div>
            )}
         </CardContent>
      </Card>
   )
}

'use client'

import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from 'lucide-react'
import { use, useMemo, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFormatter } from '@/lib/formatter-context'


// --- Sorting ---

function compareRows(a, b, key, direction) {
   let valA = a[key]
   let valB = b[key]

   const nullA = valA == null
   const nullB = valB == null
   if (nullA && nullB) {
      return 0
   }
   if (nullA) {
      return 1
   }
   if (nullB) {
      return -1
   }

   let result
   if (key === 'last_change_date') {
      result = new Date(valA) - new Date(valB)
   } else if (key === 'title') {
      result = String(valA).localeCompare(String(valB))
   } else {
      result = Number(valA) - Number(valB)
   }
   return direction === 'asc' ? result : -result
}

const COLUMNS = [
   { key: 'title', label: 'Title', align: 'left' },
   { key: 'first_price', label: 'First price', align: 'right' },
   { key: 'price', label: 'Current price', align: 'right' },
   { key: 'change_abs', label: 'Change', align: 'right' },
   { key: 'change_count', label: '# Changes', align: 'right' },
   { key: 'last_change_date', label: 'Last change', align: 'right' },
   { key: 'history', label: 'History', align: 'left', noSort: true },
]


// --- Price badge ---

function PriceBadge({ entry, formatter }) {
   return (
      <Tooltip delay={200}>
         <TooltipTrigger className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums font-medium cursor-default">
            {formatter.asDecimal(entry.price)}
         </TooltipTrigger>
         <TooltipContent side="bottom">
            {formatter.asMediumDate(new Date(entry.date))}
         </TooltipContent>
      </Tooltip>
   )
}


// --- History cell ---

function HistoryCell({ history, formatter }) {
   return (
      <div className="flex flex-wrap items-center gap-1">
         {history.map((entry, i) => (
            <span key={i} className="inline-flex items-center gap-1">
               <PriceBadge entry={entry} formatter={formatter} />
               {i < history.length - 1 && (
                  <ArrowRightIcon className="size-3 text-muted-foreground shrink-0" />
               )}
            </span>
         ))}
      </div>
   )
}


// --- Main component ---

export default function PriceHistory({ data }) {
   const rows = use(data)
   const formatter = useFormatter()
   const [sort, setSort] = useState({ key: 'last_change_date', direction: 'desc' })

   const enriched = useMemo(() => rows.map(row => ({
      ...row,
      change_abs: row.price - row.first_price,
      change_pct: row.first_price ? ((row.price - row.first_price) / row.first_price) * 100 : null,
      change_count: Array.isArray(row.price_history) ? row.price_history.length - 1 : 0,
   })), [rows])

   const sorted = useMemo(() => {
      return [...enriched].sort((a, b) => compareRows(a, b, sort.key, sort.direction))
   }, [enriched, sort])

   const handleSort = (key) => {
      setSort(prev => ({
         key,
         direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
      }))
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Price history: {rows.length} car{rows.length !== 1 ? 's' : ''} with price changes</CardTitle>
         </CardHeader>
         <CardContent className="px-0">
            <Table>
               <TableHeader>
                  <TableRow>
                     {COLUMNS.map(col => (
                        <TableHead
                           key={col.key}
                           className={`${col.align === 'right' ? 'text-right' : ''} ${!col.noSort ? 'cursor-pointer hover:bg-muted/50' : ''} select-none transition-colors`}
                           onClick={!col.noSort ? () => handleSort(col.key) : undefined}
                        >
                           <span className="inline-flex items-center gap-1">
                              {col.label}
                              {!col.noSort && sort.key === col.key && (
                                 sort.direction === 'asc'
                                    ? <ArrowUpIcon className="size-3" />
                                    : <ArrowDownIcon className="size-3" />
                              )}
                           </span>
                        </TableHead>
                     ))}
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {sorted.map(row => {
                     const isDown = row.change_abs < 0
                     const isUp = row.change_abs > 0
                     const changeColor = isDown
                        ? 'text-green-600 dark:text-green-400'
                        : isUp
                           ? 'text-red-600 dark:text-red-400'
                           : 'text-muted-foreground'
                     const changeSign = isUp ? '+' : ''

                     return (
                        <TableRow key={row.vehicle_id}>
                           <TableCell>
                              <a
                                 href={row.url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="hover:underline line-clamp-1 max-w-72 block"
                                 title={row.title}
                              >
                                 {row.title}
                              </a>
                           </TableCell>
                           <TableCell className="text-right tabular-nums text-muted-foreground">
                              {formatter.asDecimal(row.first_price)}
                           </TableCell>
                           <TableCell className="text-right tabular-nums font-medium">
                              {formatter.asDecimal(row.price)}
                           </TableCell>
                           <TableCell className={`text-right tabular-nums ${changeColor}`}>
                              <span className="block">{changeSign}{formatter.asDecimal(row.change_abs)}</span>
                              {row.change_pct != null && (
                                 <span className="block text-xs">
                                    {changeSign}{row.change_pct.toFixed(1)}%
                                 </span>
                              )}
                           </TableCell>
                           <TableCell className="text-right tabular-nums">
                              {row.change_count}
                           </TableCell>
                           <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                              {formatter.asMediumDate(new Date(row.last_change_date))}
                           </TableCell>
                           <TableCell>
                              <HistoryCell history={row.price_history} formatter={formatter} />
                           </TableCell>
                        </TableRow>
                     )
                  })}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
   )
}

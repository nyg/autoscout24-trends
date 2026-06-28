'use client'

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { use, useMemo, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useFormatter } from '@/lib/formatter-context'


// --- Sorting ---

function compareRows(a, b, col, direction) {
   let valA = a[col.sortKey]
   let valB = b[col.sortKey]

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
   if (col.sortType === 'date') {
      result = new Date(valA) - new Date(valB)
   } else if (col.sortType === 'text') {
      result = String(valA).localeCompare(String(valB))
   } else {
      result = Number(valA) - Number(valB)
   }
   return direction === 'asc' ? result : -result
}

const COLUMNS = [
   { key: 'title',          label: 'Title',        align: 'left',   sortKey: 'title',                   sortType: 'text' },
   { key: 'seller',         label: 'Seller',       align: 'right',  sortKey: 'seller_name',             sortType: 'text' },
   { key: 'year',           label: 'Year',         align: 'right',  sortKey: 'first_registration_date', sortType: 'date' },
   { key: 'mileage',        label: 'Mileage',      align: 'right',  sortKey: 'mileage',                 sortType: 'numeric' },
   { key: 'price',          label: 'Price',        align: 'right',  sortKey: 'price',                   sortType: 'numeric' },
   { key: 'change_abs',     label: 'Change',       align: 'right',  sortKey: 'change_pct',              sortType: 'numeric' },
   { key: 'change_count',   label: '# Changes',    align: 'right',  sortKey: 'change_count',            sortType: 'numeric' },
   { key: 'history',        label: 'History',      align: 'left',   noSort: true },
   { key: 'listed_since',   label: 'Listed since', align: 'right',  sortKey: 'created_date',            sortType: 'date' },
   { key: 'last_change',    label: 'Last change',  align: 'right',  sortKey: 'last_change_date',        sortType: 'date' },
   { key: 'is_active',      label: 'Active',       align: 'center', sortKey: 'is_active',               sortType: 'numeric' },
]


// --- History cell ---

function HistoryCell({ history, formatter }) {
   return (
      <div className="space-y-0.5 tabular-nums">
         {history.map((entry, i) => {
            const prev = history[i - 1]
            const delta = prev != null ? entry.price - prev.price : null
            const deltaPct = prev != null && prev.price ? (delta / prev.price) * 100 : null
            const deltaSign = delta > 0 ? '+' : ''
            const deltaColor = delta < 0 ? 'text-green-600 dark:text-green-400' : delta > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
            return (
               <div key={i} className="flex gap-1.5 whitespace-nowrap items-baseline">
                  <span className="text-muted-foreground text-xs">{formatter.asMediumDate(new Date(entry.date))}:</span>
                  <span className="font-medium">{formatter.asDecimal(entry.price)}</span>
                  {delta != null && (
                     <span className={`text-xs ${deltaColor}`}>
                        {deltaSign}{formatter.asDecimal(delta)}{deltaPct != null ? ` (${deltaSign}${deltaPct.toFixed(1)}%)` : ''}
                     </span>
                  )}
               </div>
            )
         })}
      </div>
   )
}


// --- Row renderer ---

function PriceHistoryRow({ row, formatter }) {
   const isDown = row.change_abs < 0
   const isUp = row.change_abs > 0
   const changeColor = isDown
      ? 'text-green-600 dark:text-green-400'
      : isUp
         ? 'text-red-600 dark:text-red-400'
         : 'text-muted-foreground'
   const changeSign = isUp ? '+' : ''

   return (
      <TableRow>
         {/* title */}
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
         {/* seller */}
         <TableCell className="text-right">
            <div>{row.seller_name ?? '-'}</div>
            {(row.zip_code || row.city) && (
               <div className="text-muted-foreground text-xs">{row.zip_code} {row.city}</div>
            )}
         </TableCell>
         {/* year */}
         <TableCell className="text-right tabular-nums">
            {row.first_registration_date ? formatter.asShortDate(row.first_registration_date) : '-'}
         </TableCell>
         {/* mileage */}
         <TableCell className="text-right tabular-nums">
            {row.mileage != null ? formatter.asDecimal(row.mileage) : '-'}
         </TableCell>
         {/* price */}
         <TableCell className="text-right tabular-nums font-medium">
            {formatter.asDecimal(row.price)}
         </TableCell>
         {/* change */}
         <TableCell className={`text-right tabular-nums ${changeColor}`}>
            <span className="block">{changeSign}{formatter.asDecimal(row.change_abs)}</span>
            {row.change_pct != null && (
               <span className="block text-xs">{changeSign}{row.change_pct.toFixed(1)}%</span>
            )}
         </TableCell>
         {/* # changes */}
         <TableCell className="text-right tabular-nums">{row.change_count}</TableCell>
         {/* history */}
         <TableCell>
            <HistoryCell history={row.price_history} formatter={formatter} />
         </TableCell>
         {/* listed since */}
         <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
            {row.created_date ? formatter.asMediumDate(new Date(row.created_date)) : '-'}
         </TableCell>
         {/* last change */}
         <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
            {formatter.asMediumDate(new Date(row.last_change_date))}
         </TableCell>
         {/* active */}
         <TableCell className="text-center">
            <span
               className={`inline-block size-2 rounded-full ${row.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
               title={row.is_active ? 'Active' : 'Not active'}
            />
         </TableCell>
      </TableRow>
   )
}


// --- Main component ---

export default function PriceHistory({ data }) {
   const rows = use(data)
   const formatter = useFormatter()
   const [sort, setSort] = useState({ key: 'last_change', direction: 'desc' })

   const enriched = useMemo(() => rows.map(row => ({
      ...row,
      change_abs: row.price - row.first_price,
      change_pct: row.first_price ? ((row.price - row.first_price) / row.first_price) * 100 : null,
      change_count: Array.isArray(row.price_history) ? row.price_history.length - 1 : 0,
   })), [rows])

   const sorted = useMemo(() => {
      const col = COLUMNS.find(c => c.key === sort.key)
      if (!col || col.noSort) {
         return enriched
      }
      return [...enriched].sort((a, b) => compareRows(a, b, col, sort.direction))
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
                           className={`${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${!col.noSort ? 'cursor-pointer hover:bg-muted/50' : ''} select-none transition-colors`}
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
                  {sorted.map(row => (
                     <PriceHistoryRow key={row.vehicle_id} row={row} formatter={formatter} />
                  ))}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
   )
}

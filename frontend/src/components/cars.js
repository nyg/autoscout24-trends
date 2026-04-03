'use client'

import { asDecimal, asMediumDate, asShortDate } from '@/lib/format'
import { use, useCallback, useEffect, useMemo, useReducer, useState, useSyncExternalStore } from 'react'
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
   DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
   DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import PlaceDetails from '@/components/place-details'
import {
   ArrowDownIcon, ArrowUpIcon, CameraIcon,
   MapIcon, MapPinIcon, NavigationIcon, SlidersHorizontalIcon
} from 'lucide-react'


// --- Column definitions ---

const COLUMNS = [
   { key: 'title', label: 'Title', sortType: 'text', sortKey: 'title', align: 'left', defaultVisible: true },
   { key: 'price', label: 'Price', sortType: 'numeric', sortKey: 'price', align: 'right', defaultVisible: true },
   { key: 'color', label: 'Color', sortType: 'text', sortKey: 'color', align: 'right', defaultVisible: true },
   { key: 'year', label: 'Year', sortType: 'date', sortKey: 'first_registration_date', align: 'right', defaultVisible: true },
   { key: 'mileage', label: 'Mileage', sortType: 'numeric', sortKey: 'mileage', align: 'right', defaultVisible: true },
   { key: 'km_year', label: 'km / year', sortType: 'numeric', sortKey: 'km_year', align: 'right', defaultVisible: true },
   { key: 'seller', label: 'Seller', sortType: 'text', sortKey: 'seller_name', align: 'right', defaultVisible: true },
   { key: 'listed_since', label: 'Listed since', sortType: 'date', sortKey: 'created_date', align: 'right', defaultVisible: true },
   { key: 'body_type', label: 'Body type', sortType: 'text', sortKey: 'body_type', align: 'right', defaultVisible: false },
   { key: 'fuel_type', label: 'Fuel type', sortType: 'text', sortKey: 'fuel_type', align: 'right', defaultVisible: false },
   { key: 'kilo_watts', label: 'Power (kW)', sortType: 'numeric', sortKey: 'kilo_watts', align: 'right', defaultVisible: false },
   { key: 'cm3', label: 'Engine (cm³)', sortType: 'numeric', sortKey: 'cm3', align: 'right', defaultVisible: false },
   { key: 'cylinders', label: 'Cylinders', sortType: 'numeric', sortKey: 'cylinders', align: 'right', defaultVisible: false },
   { key: 'cylinder_layout', label: 'Cylinder layout', sortType: 'text', sortKey: 'cylinder_layout', align: 'right', defaultVisible: false },
   { key: 'avg_consumption', label: 'Avg consumption', sortType: 'numeric', sortKey: 'avg_consumption', align: 'right', defaultVisible: false },
   { key: 'co2_emission', label: 'CO₂ (g/km)', sortType: 'numeric', sortKey: 'co2_emission', align: 'right', defaultVisible: false },
   { key: 'has_additional_set_of_tires', label: 'Extra tires', sortType: 'text', sortKey: 'has_additional_set_of_tires', align: 'right', defaultVisible: false },
   { key: 'had_accident', label: 'Had accident', sortType: 'text', sortKey: 'had_accident', align: 'right', defaultVisible: false },
   { key: 'warranty', label: 'Warranty', sortType: 'text', sortKey: 'warranty', align: 'right', defaultVisible: false },
   { key: 'leasing', label: 'Leasing', sortType: 'text', sortKey: 'leasing', align: 'right', defaultVisible: false },
   { key: 'last_inspection_date', label: 'Last inspection', sortType: 'date', sortKey: 'last_inspection_date', align: 'right', defaultVisible: false },
   { key: 'seller_type', label: 'Seller type', sortType: 'text', sortKey: 'seller_type', align: 'right', defaultVisible: false },
   { key: 'screenshot', label: 'Screenshot', sortType: null, sortKey: null, align: 'center', defaultVisible: false },
]

const VISIBILITY_STORAGE_KEY = 'car-table-visible-columns'

function getDefaultVisibleKeys() {
   return COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
}

function loadVisibleColumns() {
   try {
      const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY)
      if (stored) {
         const parsed = JSON.parse(stored)
         if (Array.isArray(parsed) && parsed.length > 0) {
            const validKeys = new Set(COLUMNS.map(c => c.key))
            const filtered = parsed.filter(key => validKeys.has(key))
            if (filtered.length > 0) {
               return filtered
            }
         }
      }
   } catch { /* ignore */ }
   return getDefaultVisibleKeys()
}

const VISIBLE_COLUMNS_EVENT = 'visible-columns-changed'

function saveVisibleColumns(keys) {
   try {
      localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(keys))
      visibleColumnsCache = keys
      window.dispatchEvent(new Event(VISIBLE_COLUMNS_EVENT))
   } catch { /* ignore */ }
}

let visibleColumnsCache = null

function subscribeVisibleColumns(callback) {
   const handleStorage = (event) => {
      if (event.storageArea !== localStorage) {
         return
      }
      if (event.key !== VISIBILITY_STORAGE_KEY) {
         return
      }
      callback(event)
   }
   window.addEventListener('storage', handleStorage)
   window.addEventListener(VISIBLE_COLUMNS_EVENT, callback)
   return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(VISIBLE_COLUMNS_EVENT, callback)
   }
}

function getVisibleColumnsSnapshot() {
   const loaded = loadVisibleColumns()
   if (!visibleColumnsCache || JSON.stringify(visibleColumnsCache) !== JSON.stringify(loaded)) {
      visibleColumnsCache = loaded
   }
   return visibleColumnsCache
}

const defaultVisibleKeys = getDefaultVisibleKeys()
function getVisibleColumnsServerSnapshot() {
   return defaultVisibleKeys
}


// --- Sorting ---

function compareCars(a, b, sortKey, sortType, direction) {
   let valA = a[sortKey]
   let valB = b[sortKey]

   const nullA = valA == null || valA === ''
   const nullB = valB == null || valB === ''
   if (nullA && nullB) {
      return 0
   }
   if (nullA) {
      return 1
   }
   if (nullB) {
      return -1
   }

   let result = 0
   if (sortType === 'numeric') {
      result = Number(valA) - Number(valB)
   } else if (sortType === 'date') {
      result = new Date(valA) - new Date(valB)
   } else {
      result = String(valA).localeCompare(String(valB))
   }

   return direction === 'asc' ? result : -result
}


// --- Truncated text with tooltip ---

function TruncatedText({ text, maxLength, className, scrollable = false }) {
   if (!text) {
      return <span className={className}>-</span>
   }

   const str = String(text)
   const truncated = str.length > maxLength

   if (!truncated) {
      return <span className={className}>{str}</span>
   }

   return (
      <Tooltip delay={300}>
         <TooltipTrigger className={className}>
            {str.substring(0, maxLength)}…
         </TooltipTrigger>
         <TooltipContent side="bottom" className={scrollable ? 'max-h-48 max-w-sm overflow-y-auto whitespace-pre-line' : 'max-w-sm'}>
            {str}
         </TooltipContent>
      </Tooltip>
   )
}


// --- Seller cell ---

function SellerCell({ car, mapsApiKey, homeAddress }) {
   const address = buildAddress(car)
   const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
   const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(homeAddress)}&destination=${encodeURIComponent(address)}`
   const isProfessional = car.seller_type === 'professional'

   return (
      <div className="flex flex-col items-end gap-0.5">
         <TruncatedText text={car.seller_name} maxLength={30} />
         <span className="text-muted-foreground text-xs">{car.zip_code} {car.city}</span>
         <div className="flex items-center gap-1 mt-0.5">
            <a
               href={mapsSearchUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="text-muted-foreground hover:text-foreground transition-colors"
               title="Open in Google Maps"
               aria-label={`Open ${address} in Google Maps`}
            >
               <MapPinIcon className="size-3.5" />
            </a>
            {homeAddress ? (
               <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Directions from home"
                  aria-label={`Get directions from home to ${address} in Google Maps`}
               >
                  <NavigationIcon className="size-3.5" />
               </a>
            ) : (
               <Tooltip>
                  <TooltipTrigger className="text-muted-foreground/50 cursor-not-allowed">
                     <NavigationIcon className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Set home address in Settings</TooltipContent>
               </Tooltip>
            )}
            {!isProfessional ? (
               <Tooltip>
                  <TooltipTrigger className="text-muted-foreground/50 cursor-not-allowed">
                     <MapIcon className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Not available for private sellers</TooltipContent>
               </Tooltip>
            ) : mapsApiKey ? (
               <MapPreviewButton car={car} apiKey={mapsApiKey} />
            ) : (
               <Tooltip>
                  <TooltipTrigger className="text-muted-foreground/50 cursor-not-allowed">
                     <MapIcon className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Set Google Maps API key in Settings</TooltipContent>
               </Tooltip>
            )}
         </div>
      </div>
   )
}

function buildAddress(car) {
   const location = [car.seller_address, `${car.zip_code} ${car.city}`].filter(Boolean).join(', ')
   return car.seller_type === 'professional'
      ? `${car.seller_name}, ${location}`
      : location
}

function MapPreviewButton({ car, apiKey }) {
   return (
      <Popover>
         <PopoverTrigger
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Seller details on Google Maps"
            aria-label="Open seller details in Google Maps"
         >
            <MapIcon className="size-3.5" />
         </PopoverTrigger>
         <PopoverContent side="left" className="w-80 p-3">
            <PlaceDetails
               sellerName={car.seller_name}
               zipCode={car.zip_code}
               city={car.city}
               apiKey={apiKey}
            />
         </PopoverContent>
      </Popover>
   )
}


// --- Cell renderers ---

function renderCell(col, car, options, config) {
   switch (col.key) {
      case 'title': {
         const desc = car.subtitle || car.description || '-'
         const titleStr = car.title || ''
         const isTitleTruncated = titleStr.length > 100
         const displayTitle = isTitleTruncated ? `${titleStr.substring(0, 100)}…` : titleStr

         const titleLink = (
            <a className="hover:underline" href={car.url} target="_blank" rel="noopener noreferrer">
               {displayTitle}
            </a>
         )

         return (
            <TableCell key={col.key}>
               {isTitleTruncated ? (
                  <Tooltip delay={300}>
                     <TooltipTrigger render={titleLink} />
                     <TooltipContent side="bottom" className="max-w-sm">{titleStr}</TooltipContent>
                  </Tooltip>
               ) : titleLink}
               <br />
               <TruncatedText
                  text={desc}
                  maxLength={100}
                  className="text-muted-foreground"
                  scrollable
               />
            </TableCell>
         )
      }
      case 'price':
         return <TableCell key={col.key} className="text-right tabular-nums" suppressHydrationWarning>{asDecimal(car.price)}</TableCell>
      case 'color':
         return <TableCell key={col.key} className="text-right">{car.color}</TableCell>
      case 'year':
         return <TableCell key={col.key} className="text-right tabular-nums" suppressHydrationWarning>{asShortDate(car.first_registration_date)}</TableCell>
      case 'mileage':
         return <TableCell key={col.key} className="text-right tabular-nums" suppressHydrationWarning>{asDecimal(car.mileage)}</TableCell>
      case 'km_year':
         return <TableCell key={col.key} className="text-right tabular-nums" suppressHydrationWarning>{asDecimal(car.km_year)}</TableCell>
      case 'seller':
         return <TableCell key={col.key} className="text-right"><SellerCell car={car} mapsApiKey={config['google-maps-api-key']} homeAddress={config['home-address']} /></TableCell>
      case 'listed_since':
         return (
            <TableCell key={col.key} className="text-right tabular-nums" suppressHydrationWarning>
               {asMediumDate(car.created_date)}
               {options.listingEnded ? <><br />{asMediumDate(car.date_in)}</> : null}
            </TableCell>
         )
      case 'has_additional_set_of_tires':
      case 'had_accident':
      case 'warranty':
      case 'leasing':
         return <TableCell key={col.key} className="text-right">{car[col.sortKey] === true ? 'Yes' : car[col.sortKey] === false ? 'No' : '-'}</TableCell>
      case 'last_inspection_date':
         return <TableCell key={col.key} className="text-right tabular-nums" suppressHydrationWarning>{car.last_inspection_date ? asShortDate(car.last_inspection_date) : '-'}</TableCell>
      case 'avg_consumption':
         return <TableCell key={col.key} className="text-right tabular-nums">{car.avg_consumption != null ? Number(car.avg_consumption).toFixed(1) : '-'}</TableCell>
      case 'kilo_watts':
      case 'cm3':
      case 'co2_emission':
      case 'cylinders':
         return <TableCell key={col.key} className="text-right tabular-nums">{car[col.sortKey] != null ? asDecimal(car[col.sortKey]) : '-'}</TableCell>
      case 'screenshot':
         return (
            <TableCell key={col.key} className="text-center">
               <a
                  href={`/api/screenshot/${car.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex"
                  title="View screenshot"
               >
                  <CameraIcon className="size-4" />
               </a>
            </TableCell>
         )
      default:
         return <TableCell key={col.key} className="text-right">{car[col.sortKey] ?? '-'}</TableCell>
   }
}


// --- Main component ---

export default function Cars({ name, data, options = {}, config = {} }) {
   const cars = use(data)

   // Force re-render after hydration so client locale formatters take effect
   const [, rerender] = useReducer(x => x + 1, 0)
   useEffect(rerender, [])

   const activeKeys = useSyncExternalStore(subscribeVisibleColumns, getVisibleColumnsSnapshot, getVisibleColumnsServerSnapshot)
   const [sort, setSort] = useState({ key: 'price', direction: 'asc' })

   const toggleColumn = useCallback((key) => {
      const current = getVisibleColumnsSnapshot()
      const next = current.includes(key)
         ? current.filter(k => k !== key)
         : [...current, key]
      saveVisibleColumns(next)
   }, [])

   const handleSort = useCallback((key) => {
      setSort(prev => ({
         key,
         direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }))
   }, [])

   const visibleColumns = useMemo(
      () => COLUMNS.filter(c => activeKeys.includes(c.key)),
      [activeKeys]
   )

   const sortedCars = useMemo(() => {
      const col = COLUMNS.find(c => c.key === sort.key)
      if (!col) {
         return cars
      }
      return [...cars].sort((a, b) => compareCars(a, b, col.sortKey, col.sortType, sort.direction))
   }, [cars, sort])

   return (
      <Card>
         <CardHeader>
            <CardTitle>{name}: {cars.length} cars</CardTitle>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                     <SlidersHorizontalIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                     <DropdownMenuGroup>
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {COLUMNS.map(col => (
                           <DropdownMenuCheckboxItem
                              key={col.key}
                              checked={activeKeys.includes(col.key)}
                              onCheckedChange={() => toggleColumn(col.key)}
                           >
                              {col.label}
                           </DropdownMenuCheckboxItem>
                        ))}
                     </DropdownMenuGroup>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>
         <CardContent className="px-0">
            <Table>
               <TableHeader>
                  <TableRow>
                     {visibleColumns.map(col => (
                        <TableHead
                           key={col.key}
                           className={`${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.sortKey ? 'cursor-pointer hover:bg-muted/50' : ''} select-none transition-colors`}
                           onClick={col.sortKey ? () => handleSort(col.key) : undefined}
                        >
                           <span className="inline-flex items-center gap-1">
                              {col.key === 'listed_since' && options.listingEnded ? 'Listing duration' : col.label}
                              {sort.key === col.key && (
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
                  {sortedCars.map(car => (
                     <TableRow key={car.id}>
                        {visibleColumns.map(col => renderCell(col, car, options, config))}
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
   )
}

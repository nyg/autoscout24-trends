'use client'

import { asDecimal, asLongDate, asShortDate } from '@/lib/format'
import { use } from 'react'
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


export default function Cars({ name, data, options = {} }) {
   const cars = use(data)

   return (
      <Card>
         <CardHeader>
            <CardTitle>{name}: {cars.length} cars</CardTitle>
         </CardHeader>
         <CardContent className="px-0">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Title</TableHead>
                     <TableHead className="text-right">Price</TableHead>
                     <TableHead className="text-right">Color</TableHead>
                     <TableHead className="text-right">Year</TableHead>
                     <TableHead className="text-right">Mileage</TableHead>
                     <TableHead className="text-right">km / year</TableHead>
                     <TableHead className="text-right">Seller</TableHead>
                     <TableHead className="text-right">{options.listingEnded ? 'Listing duration' : 'Listed since'}</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {cars.map(car => (
                     <TableRow key={car.id}>
                        <TableCell>
                           <a className="hover:underline" href={car.url} target="_blank">{car.title}</a>
                           <br />
                           <span className="text-muted-foreground">{(car.subtitle || car.description || '-').substring(0, 100)}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums" suppressHydrationWarning>{asDecimal(car.price)}</TableCell>
                        <TableCell className="text-right">{car.color}</TableCell>
                        <TableCell className="text-right tabular-nums" suppressHydrationWarning>{asShortDate(car.first_registration_date)}</TableCell>
                        <TableCell className="text-right tabular-nums" suppressHydrationWarning>{asDecimal(car.mileage)}</TableCell>
                        <TableCell className="text-right tabular-nums" suppressHydrationWarning>{asDecimal(car.km_year)}</TableCell>
                        <TableCell className="text-right">
                           {car.seller_name}<br />{car.zip_code} {car.city}
                        </TableCell>
                        <TableCell className="text-right tabular-nums" suppressHydrationWarning>
                           {asLongDate(car.created_date)}<br />{asLongDate(car.date_in)}
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
   )
}

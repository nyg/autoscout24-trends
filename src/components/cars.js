'use client'

import { asDecimal, asLongDate, asShortDate } from '@/lib/format'
import { use } from 'react'


export default function Cars({ carPromise }) {
   const cars = use(carPromise)

   return (
      <div className="h-96 overflow-x-auto">
         <table className="table table-xs table-pin-rows tabular-nums text-right">
            <thead>
               <tr>
                  <th className="text-left">Title</th>
                  <th>Year</th>
                  <th>Price</th>
                  <th>Mileage</th>
                  <th>Km / year</th>
                  <th>Location</th>
                  <th>Listed since</th>
               </tr>
            </thead>
            <tbody>
               {cars.map(car => (
                  <tr key={car.id}>
                     <td className="text-left"><a href={car.url} className="link">{car.title}</a></td>
                     <td>{asShortDate(car.first_registration_date)}</td>
                     <td suppressHydrationWarning>{asDecimal(car.price)}</td>
                     <td suppressHydrationWarning>{asDecimal(car.mileage)}</td>
                     <td suppressHydrationWarning>{asDecimal(car.km_year)}</td>
                     <td>{car.zip_code} {car.city}</td>
                     <td suppressHydrationWarning>{asLongDate(car.created_date)}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   )
}

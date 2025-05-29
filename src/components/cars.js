'use client'

import { asDecimal, asLongDate, asShortDate } from '@/lib/format'
import { use } from 'react'


export default function Cars({ name, carPromise }) {
   const cars = use(carPromise)

   return (
      <div>
         <h2>{name}: {cars.length} cars</h2>
         <table className="table table-xs table-pin-rows tabular-nums overflow-x-auto">
            <thead>
               <tr>
                  <th>Title</th>
                  <th className="text-right">Year</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Mileage</th>
                  <th className="text-right">km / year</th>
                  <th className="text-right">Location</th>
                  <th className="text-right">Seller</th>
                  <th className="text-right">Listed since</th>
               </tr>
            </thead>
            <tbody>
               {cars.map(car => (
                  <tr key={car.id}>
                     <td><a href={car.url} target="_blank">{car.title}</a></td>
                     <td className="text-right" suppressHydrationWarning>{asShortDate(car.first_registration_date)}</td>
                     <td className="text-right" suppressHydrationWarning>{asDecimal(car.price)}</td>
                     <td className="text-right" suppressHydrationWarning>{asDecimal(car.mileage)}</td>
                     <td className="text-right" suppressHydrationWarning>{asDecimal(car.km_year)}</td>
                     <td className="text-right">{car.zip_code} {car.city}</td>
                     <td className="text-right">{car.name}</td>
                     <td className="text-right" suppressHydrationWarning>{asLongDate(car.created_date)}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   )
}

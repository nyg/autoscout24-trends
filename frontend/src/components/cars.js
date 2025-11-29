'use client'

import { asDecimal, asLongDate, asShortDate } from '@/lib/format'
import { use } from 'react'


export default function Cars({ name, data, options = {} }) {
   const cars = use(data)

   return (
      <div>
         <h2>{name}: {cars.length} cars</h2>
         <table className="table table-xs table-pin-rows tabular-nums overflow-x-auto vertical">
            <thead>
               <tr>
                  <th>Title</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Color</th>
                  <th className="text-right">Year</th>
                  <th className="text-right">Mileage</th>
                  <th className="text-right">km / year</th>
                  <th className="text-right">Seller</th>
                  <th className="text-right">{options.listingEnded ? 'Listing duration' : 'Listed since'}</th>
               </tr>
            </thead>
            <tbody>
               {cars.map(car => (
                  <tr key={car.id}>
                     <td><a className="no-underline hover:underline" href={car.url} target="_blank">{car.title}</a><br /><span>{(car.subtitle || car.description || '-').substring(0, 100)}</span></td>
                     <td className="text-right align-middle" suppressHydrationWarning>{asDecimal(car.price)}</td>
                     <td className="text-right align-middle">{car.color}</td>
                     <td className="text-right align-middle" suppressHydrationWarning>{asShortDate(car.first_registration_date)}</td>
                     <td className="text-right align-middle" suppressHydrationWarning>{asDecimal(car.mileage)}</td>
                     <td className="text-right align-middle" suppressHydrationWarning>{asDecimal(car.km_year)}</td>
                     <td className="text-right">{car.seller_name}<br />{car.zip_code} {car.city}</td>
                     <td className="text-right" suppressHydrationWarning>{asLongDate(car.created_date)}<br/>{asLongDate(car.date_in)}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   )
}

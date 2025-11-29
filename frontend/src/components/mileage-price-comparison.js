'use client'

import { asDecimal } from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, Tooltip, XAxis, YAxis, ScatterChart, Scatter } from 'recharts'


export default function MileagePriceComparison({ data }) {
   const listings = use(data)

   return (
      <div className="flex-1 border-0 border-gray-400 rounded">
         <ScatterChart responsive margin={{ top: 20, right: 20, bottom: 50, left: 30 }} height={450}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mileage" type="number" name="mileage" domain={['auto', 'auto']} tickFormatter={asDecimal} label={{ value: 'Mileage (km)', position: 'bottom' }} />
            <YAxis dataKey="price" type="number" name="price" domain={['auto', 'auto']} tickFormatter={asDecimal} label={{ value: 'Price (CHF)', position: 'left', angle: -90 }} />
            <Tooltip />
            <Scatter name="Price / Mileage" data={listings} fill="#8884d8" />
         </ScatterChart>
      </div>
   )
}

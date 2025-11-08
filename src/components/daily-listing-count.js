'use client'

import { asLongDate, asDecimal } from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, Tooltip, Line, XAxis, YAxis, Legend, ComposedChart, Bar } from 'recharts'


export default function DailyListingCount({ data }) {
   const listings = use(data)

   const dateDomain = [
      Math.min(...listings.map(l => l.date)) - 43200000,
      Math.max(...listings.map(l => l.date)) + 43200000]

   const carCountDomain = [
      Math.min(...listings.map(l => l.car_count)) - 1,
      Math.max(...listings.map(l => l.car_count)) + 1]

   return (
      <div className="flex-1 border-0 border-gray-400 rounded">
         <ComposedChart data={listings} responsive margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
         }} height={450}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" scale="time" type="number" domain={dateDomain} tickFormatter={asLongDate} />
            <YAxis yAxisId="price" domain={['auto', 'auto']} orientation="left" tickFormatter={asDecimal} />
            <YAxis yAxisId="mileage" domain={['auto', 'auto']} orientation="right" tickFormatter={asDecimal} />
            <YAxis yAxisId="zount" domain={carCountDomain} hide="true" />
            <Tooltip />
            <Legend />
            <Line type="monotone" yAxisId="price" dataKey="price_avg" stroke="blue" strokeWidth={2} />
            <Line type="monotone" yAxisId="mileage" dataKey="mileage_avg" stroke="green" strokeWidth={2} />
            <Bar type="monotone" yAxisId="zount" dataKey="car_count" fill="#8884d8" fillOpacity={0.6} barSize={20} />
         </ComposedChart>
      </div>
   )
}

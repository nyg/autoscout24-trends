'use client'

import { asLongDate, asDecimal } from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, Line, XAxis, YAxis, ComposedChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
   price_avg: { label: 'Avg Price', color: 'var(--chart-1)' },
   mileage_avg: { label: 'Avg Mileage', color: 'var(--chart-2)' },
   car_count: { label: 'Car Count', color: 'var(--chart-3)' },
}

export default function DailyListingCount({ data }) {
   const listings = use(data)

   const dateDomain = [
      Math.min(...listings.map(l => l.date)) - 43200000,
      Math.max(...listings.map(l => l.date)) + 43200000,
   ]

   const carCountDomain = [
      Math.min(...listings.map(l => l.car_count)) - 1,
      Math.max(...listings.map(l => l.car_count)) + 1,
   ]

   return (
      <Card className="flex-1">
         <CardHeader>
            <CardTitle>Daily Listing Count</CardTitle>
         </CardHeader>
         <CardContent>
            <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
               <ComposedChart data={listings} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" scale="time" type="number" domain={dateDomain} tickFormatter={asLongDate} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="price" domain={['auto', 'auto']} orientation="left" tickFormatter={asDecimal} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="mileage" domain={['auto', 'auto']} orientation="right" tickFormatter={asDecimal} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="zount" domain={carCountDomain} hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" yAxisId="price" dataKey="price_avg" stroke="var(--color-price_avg)" strokeWidth={2} dot={false} />
                  <Line type="monotone" yAxisId="mileage" dataKey="mileage_avg" stroke="var(--color-mileage_avg)" strokeWidth={2} dot={false} />
                  <Bar yAxisId="zount" dataKey="car_count" fill="var(--color-car_count)" fillOpacity={0.4} barSize={20} radius={[4, 4, 0, 0]} />
               </ComposedChart>
            </ChartContainer>
         </CardContent>
      </Card>
   )
}

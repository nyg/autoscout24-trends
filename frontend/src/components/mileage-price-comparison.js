'use client'

import { asDecimal } from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, XAxis, YAxis, ScatterChart, Scatter } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
   listings: { label: 'Price / Mileage', color: 'var(--chart-1)' },
}

export default function MileagePriceComparison({ data }) {
   const listings = use(data)

   return (
      <Card className="flex-1">
         <CardHeader>
            <CardTitle>Mileage vs Price</CardTitle>
         </CardHeader>
         <CardContent>
            <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
               <ScatterChart margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     dataKey="mileage" type="number" name="mileage"
                     domain={['auto', 'auto']} tickFormatter={asDecimal}
                     tickLine={false} axisLine={false}
                     label={{ value: 'Mileage (km)', position: 'bottom', offset: 0 }}
                  />
                  <YAxis
                     dataKey="price" type="number" name="price"
                     domain={['auto', 'auto']} tickFormatter={asDecimal}
                     tickLine={false} axisLine={false}
                     label={{ value: 'Price (CHF)', position: 'left', angle: -90 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Scatter name="listings" data={listings} fill="var(--color-listings)" />
               </ScatterChart>
            </ChartContainer>
         </CardContent>
      </Card>
   )
}

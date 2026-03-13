'use client'

import { asDecimal } from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, XAxis, YAxis, ScatterChart, Scatter } from 'recharts'
import {
   ChartContainer,
   ChartTooltip
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
   listings: { label: 'Price / Mileage', color: 'oklch(0.809 0.105 251.813)' },
}

function MileagePriceComparisonTooltip({ active, payload }) {
   if (!active) {
      return null
   }

   const listing = payload[0].payload

   return (
      <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
         <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2 leading-none">
               <span className="text-muted-foreground">Mileage</span>
               <span className="text-foreground tabular-nums">{asDecimal(listing.mileage)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 leading-none">
               <span className="text-muted-foreground">Price</span>
               <span className="text-foreground tabular-nums">{asDecimal(listing.price)}</span>
            </div>
         </div>
      </div>
   )
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
                  <ChartTooltip content={<MileagePriceComparisonTooltip />} />
                  <Scatter name="listings" data={listings} fill="var(--color-listings)" />
               </ScatterChart>
            </ChartContainer>
         </CardContent>
      </Card>
   )
}

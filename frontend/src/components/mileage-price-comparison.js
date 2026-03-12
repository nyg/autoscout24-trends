'use client'

import { asDecimal } from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, XAxis, YAxis, ScatterChart, Scatter } from 'recharts'
import {
   ChartContainer,
   ChartTooltip
} from '@/components/ui/chart'
import { HiddenEdgeYAxisTick } from '@/components/chart-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
   listings: { label: 'Price / Mileage', color: 'var(--chart-4)' },
}

// TODO rework, add label which should be the car name
function MileagePriceComparisonTooltip({ active, payload, valueFormatter }) {
   if (!active || !payload?.length) {
      return null
   }

   const listing = payload[0].payload

   return (
      <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
         <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2 leading-none">
               <span className="text-muted-foreground">Mileage</span>
               <span className="text-foreground tabular-nums">{valueFormatter(listing.mileage)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 leading-none">
               <span className="text-muted-foreground">Price</span>
               <span className="text-foreground tabular-nums">{valueFormatter(listing.price)}</span>
            </div>
         </div>
      </div>
   )
}

// TODO mileage x-axis ticks should be "round numbers", e.g. 10k, 15k, 20k, ...
function mileageDomain(listings) {
   const mileages = listings.map(l => l.mileage)
   return [Math.min(...mileages) - 500, Math.max(...mileages) + 500]
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
               <ScatterChart margin={{ top: 10, right: 0, bottom: 28, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     name="mileage"
                     dataKey="mileage"
                     type="number"
                     domain={mileageDomain(listings)}
                     tickFormatter={asDecimal}
                     unit=" km"
                     tickLine={false}
                     tickMargin={8}
                     axisLine={false}
                  />
                  <YAxis
                     name="price"
                     dataKey="price"
                     type="number"
                     domain={['auto', 'auto']}
                     tick={<HiddenEdgeYAxisTick unit='.-' formatter={asDecimal} />}
                     tickLine={false}
                     axisLine={false}
                  />
                  <ChartTooltip content={<MileagePriceComparisonTooltip valueFormatter={asDecimal} />} />
                  <Scatter name="listings" data={listings} fill="var(--color-listings)" />
               </ScatterChart>
            </ChartContainer>
         </CardContent>
      </Card>
   )
}

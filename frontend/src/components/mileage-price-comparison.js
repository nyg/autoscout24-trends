'use client'

import { use } from 'react'
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'

import { HiddenEdgeYAxisTick } from '@/components/chart-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   ChartContainer,
   ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart'
import { useFormatter } from '@/lib/formatter-context'

const chartConfig = {
   listings: { label: 'Price / Mileage', color: 'var(--chart-4)' },
}

function ClickableScatterPoint({ cx, cy, fill, payload, size = 64 }) {
   return (
      <circle
         cx={cx}
         cy={cy}
         r={Math.sqrt(size / Math.PI)}
         fill={fill}
         role='link'
         tabIndex={0}
         className='cursor-pointer focus:outline-none'
         aria-label={`Open ${payload.title} in a new tab`}
         onClick={ ()=> window.open(payload.url, '_blank', 'noopener,noreferrer')} />
   )
}

function mileageDomain(listings) {
   const mileages = listings.map(l => l.mileage)
   const min = Math.min(...mileages)
   const max = Math.max(...mileages)
   const step = max > 0 ? Math.pow(10, Math.floor(Math.log10(max)) - 1) : 1000
   const lo = Math.floor(min / step) * step
   const hi = Math.ceil(max / step) * step
   return [lo, hi === lo ? hi + step : hi]
}

export default function MileagePriceComparison({ data }) {
   const listings = use(data)
   const { asDecimal } = useFormatter()

   return (
      <Card className="flex-1">
         <CardHeader>
            <CardTitle>Mileage vs Price</CardTitle>
         </CardHeader>
         <CardContent>
            <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
               <ScatterChart margin={{ top: 10, right: 5, bottom: 28, left: 0 }}>
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
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload[0].payload.title} valueFormatter={asDecimal} hideIndicator={true} />} />
                  <Scatter name="listings" data={listings} fill="var(--color-listings)" shape={<ClickableScatterPoint />} />
               </ScatterChart>
            </ChartContainer>
         </CardContent>
      </Card>
   )
}

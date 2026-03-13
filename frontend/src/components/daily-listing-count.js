'use client'

import {
   asLongDate, asDecimal, asMonthYearDate, asShortDate,
   asShortMonthYearDate
} from '@/lib/format'
import { use } from 'react'
import { CartesianGrid, Line, XAxis, YAxis, ComposedChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
   price_avg: { label: 'Average Price', color: 'oklch(0.62 0.2 259)' },
   mileage_avg: { label: 'Average Mileage', color: 'oklch(0.72 0.17 150)' },
   car_count: { label: 'Car Count', color: 'oklch(0.78 0.17 85)' },
}

function DailyListingCountTooltip({ active, payload, label }) {
   if (!active || !payload?.length) {
      return null
   }

   return (
      <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
         <div className="font-medium">{asLongDate(Number(label))}</div>
         <div className="grid gap-1.5">
            {payload.map(item => (
               <div
                  key={item.dataKey}
                  className="flex w-full items-center gap-2"
               >
                  <div
                     className="h-2.5 w-2.5 shrink-0 rounded-xs"
                     style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                     <span className="min-w-0 text-muted-foreground">{chartConfig[item.dataKey].label}</span>
                     <span className="text-foreground tabular-nums">
                        {asDecimal(item.value)}
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

export default function DailyListingCount({ data }) {
   const listings = use(data)

   const carCountDomain = [
      Math.min(...listings.map(l => l.car_count)) * .9,
      Math.max(...listings.map(l => l.car_count)) * 2,
   ]

   return (
      <Card className="flex-1">
         <CardHeader>
            <CardTitle>Daily Listing Count</CardTitle>
         </CardHeader>
         <CardContent>
            <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
               <ComposedChart data={listings}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" scale="time" type="auto" tickFormatter={asLongDate} tickMargin={8} minTickGap={30} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="price" domain={['auto', 'auto']} unit='.-' orientation="right" tickFormatter={asDecimal} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="mileage" domain={['auto', 'auto']} unit=' km' className={'tabular-nums'} width={82} orientation="left" tickFormatter={asDecimal} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="zount" domain={carCountDomain} hide />
                  <ChartTooltip content={<DailyListingCountTooltip />} />
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

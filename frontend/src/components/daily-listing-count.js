'use client'

import { asLongDate, asDecimal, asShortMonthYearDate } from '@/lib/format'
import { use, useState } from 'react'
import { CartesianGrid, Line, XAxis, YAxis, ComposedChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart'
import { HiddenEdgeYAxisTick } from '@/components/chart-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
   price_avg: { label: 'Average Price', color: 'var(--chart-1)' },
   mileage_avg: { label: 'Average Mileage', color: 'var(--chart-2)' },
   car_count: { label: 'Car Count', color: 'var(--chart-3)' },
}

function monthlyXAxisTicks(listings) {
   const months = {}

   for (const timestamp of listings.map(l => Number(l.date)).toSorted((a, b) => a - b)) {
      const date = new Date(timestamp)
      if (date.getDate() > 15) continue

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      months[monthKey] = timestamp
   }

   return Object.values(months)
}

function carCountDomain(listings) {
   const carCounts = listings.map(l => l.car_count)
   return [Math.min(...carCounts) * .9, Math.max(...carCounts) * 2]
}

// TODO try again to use default tooltip
function DailyListingCountTooltip({ active, payload, label, labelFormatter, valueFormatter }) {
   if (!active || !payload?.length) {
      return null
   }

   return (
      <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
         <div className="font-medium">{labelFormatter(Number(label))}</div>
         <div className="grid gap-1.5">
            {payload.map(item => (
               <div key={item.dataKey} className="flex w-full items-center gap-2">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                  <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                     <span className="min-w-0 text-muted-foreground">{chartConfig[item.dataKey].label}</span>
                     <span className="text-foreground tabular-nums">
                        {valueFormatter(item.value)}
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

function DailyListingCountLegend({ hiddenDataKeys, onToggleDataKey }) {
   return (
      <div className="pt-3 flex items-center justify-center gap-4">
         {Object.entries(chartConfig).map(([dataKey, { label, color }]) => {
            const isHidden = Boolean(hiddenDataKeys[dataKey])

            return (
               <button
                  key={dataKey}
                  type="button"
                  aria-pressed={!isHidden}
                  onClick={() => onToggleDataKey(dataKey)}
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                  style={{ opacity: isHidden ? 0.45 : 1 }}
               >
                  <div className="h-2 w-2 shrink-0 rounded-xs" style={{ backgroundColor: color }} />
                  <span>{label}</span>
               </button>
            )
         })}
      </div>
   )
}

export default function DailyListingCount({ data }) {
   const listings = use(data)
   const [hiddenDataKeys, setHiddenDataKeys] = useState({})

   function toggleDataKey(dataKey) {
      setHiddenDataKeys(current => ({
         ...current,
         [dataKey]: !current[dataKey],
      }))
   }

   return (
      <Card className="flex-1">
         <CardHeader>
            <CardTitle>Daily Listing Count</CardTitle>
         </CardHeader>
         <CardContent>
            <ChartContainer config={chartConfig} className="min-h-87.5 w-full">
               <ComposedChart data={listings} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     dataKey="date"
                     scale="time"
                     type="number"
                     ticks={monthlyXAxisTicks(listings)}
                     tickFormatter={asShortMonthYearDate}
                     tickMargin={8}
                     tickLine={false}
                     axisLine={false}
                  />
                  <YAxis
                     yAxisId="price"
                     domain={['auto', 'auto']}
                     unit='.-'
                     orientation="left"
                     tick={<HiddenEdgeYAxisTick unit='.-' formatter={asDecimal} />}
                     tickLine={false}
                     axisLine={false}
                  />
                  <YAxis
                     yAxisId="mileage"
                     domain={['auto', 'auto']}
                     unit=' km'
                     width={82}
                     orientation="right"
                     tick={<HiddenEdgeYAxisTick unit=' km' formatter={asDecimal} />}
                     tickLine={false}
                     axisLine={false}
                  />
                  <YAxis yAxisId="zount" domain={carCountDomain(listings)} hide />
                  <ChartTooltip content={<DailyListingCountTooltip labelFormatter={asLongDate} valueFormatter={asDecimal} />} />
                  <ChartLegend content={<DailyListingCountLegend hiddenDataKeys={hiddenDataKeys} onToggleDataKey={toggleDataKey} />} />
                  <Line type="monotone" yAxisId="price" dataKey="price_avg" stroke="var(--color-price_avg)" strokeWidth={2} dot={false} hide={Boolean(hiddenDataKeys.price_avg)} />
                  <Line type="monotone" yAxisId="mileage" dataKey="mileage_avg" stroke="var(--color-mileage_avg)" strokeWidth={2} dot={false} hide={Boolean(hiddenDataKeys.mileage_avg)} />
                  <Bar yAxisId="zount" dataKey="car_count" fill="var(--color-car_count)" fillOpacity={0.4} barSize={20} radius={[4, 4, 0, 0]} hide={Boolean(hiddenDataKeys.car_count)} />
               </ComposedChart>
            </ChartContainer>
         </CardContent>
      </Card>
   )
}

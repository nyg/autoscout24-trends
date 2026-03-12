export function HiddenEdgeYAxisTick({ x, y, payload, index, textAnchor, formatter, unit = '' }) {
   return index === 0
      ? null
      : (
         <text x={x} y={y} dominantBaseline="central" fill="currentColor" textAnchor={textAnchor} className="fill-muted-foreground tabular-nums">
            {formatter(payload.value)}{unit}
         </text>
      )
}

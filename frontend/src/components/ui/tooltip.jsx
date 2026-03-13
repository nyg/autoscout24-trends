'use client'

import * as React from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'

import { cn } from '@/lib/utils'

function Tooltip({
   ...props
}) {
   return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipProvider({
   ...props
}) {
   return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />
}

function TooltipTrigger({
   className,
   ...props
}) {
   return (
      <TooltipPrimitive.Trigger
         data-slot="tooltip-trigger"
         className={cn('cursor-default', className)}
         {...props} />
   )
}

function TooltipContent({
   side = 'top',
   sideOffset = 4,
   className,
   ...props
}) {
   return (
      <TooltipPrimitive.Portal>
         <TooltipPrimitive.Positioner
            className="isolate z-50 outline-none"
            side={side}
            sideOffset={sideOffset}>
            <TooltipPrimitive.Popup
               data-slot="tooltip-content"
               className={cn(
                  'z-50 max-w-xs rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md duration-100 origin-(--transform-origin) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
                  className
               )}
               {...props} />
         </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
   )
}

function TooltipArrow({
   className,
   ...props
}) {
   return (
      <TooltipPrimitive.Arrow
         data-slot="tooltip-arrow"
         className={cn('fill-primary', className)}
         {...props} />
   )
}

export {
   Tooltip,
   TooltipProvider,
   TooltipTrigger,
   TooltipContent,
   TooltipArrow,
}

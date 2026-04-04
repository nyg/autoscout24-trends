'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { createPortal } from 'react-dom'


export default function Lightbox({ images, initialIndex = 0, onClose }) {
   const [index, setIndex] = useState(initialIndex)

   const goPrev = useCallback(() => {
      setIndex(i => (i > 0 ? i - 1 : images.length - 1))
   }, [images.length])

   const goNext = useCallback(() => {
      setIndex(i => (i < images.length - 1 ? i + 1 : 0))
   }, [images.length])

   useEffect(() => {
      function handleKey(e) {
         if (e.key === 'Escape') {
            onClose()
         } else if (e.key === 'ArrowLeft') {
            goPrev()
         } else if (e.key === 'ArrowRight') {
            goNext()
         }
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
   }, [onClose, goPrev, goNext])

   // Prevent body scroll while lightbox is open
   useEffect(() => {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
         document.body.style.overflow = prev
      }
   }, [])

   if (!images || images.length === 0) {
      return null
   }

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
         onClick={onClose}
      >
         {/* Close button */}
         <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
         >
            <XIcon className="size-6" />
         </button>

         {/* Counter */}
         {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
               {index + 1} / {images.length}
            </div>
         )}

         {/* Previous button */}
         {images.length > 1 && (
            <button
               onClick={e => {
                  e.stopPropagation(); goPrev()
               }}
               className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
               aria-label="Previous image"
            >
               <ChevronLeftIcon className="size-6" />
            </button>
         )}

         {/* Image */}
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img
            src={images[index]}
            alt={`Image ${index + 1} of ${images.length}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
         />

         {/* Next button */}
         {images.length > 1 && (
            <button
               onClick={e => {
                  e.stopPropagation(); goNext()
               }}
               className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
               aria-label="Next image"
            >
               <ChevronRightIcon className="size-6" />
            </button>
         )}
      </div>,
      document.body,
   )
}

'use client'

import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'


export default function Lightbox({ images: initialImages, initialIndex = 0, onClose, fetchMoreUrl }) {
   const [images, setImages] = useState(initialImages)
   const [index, setIndex] = useState(initialIndex)
   const [loading, setLoading] = useState(!!fetchMoreUrl)
   const [fitMode, setFitMode] = useState('height')

   // Lazy-load additional photos (e.g., listing photos) when lightbox opens
   useEffect(() => {
      if (!fetchMoreUrl) {
         return
      }
      fetch(fetchMoreUrl)
         .then(res => res.ok ? res.json() : [])
         .then(urls => {
            if (urls.length > 0) {
               setImages(prev => [...prev, ...urls])
            }
         })
         .catch(() => {})
         .finally(() => setLoading(false))
   }, [fetchMoreUrl])

   const goPrev = useCallback(() => {
      setIndex(i => (i > 0 ? i - 1 : images.length - 1))
   }, [images.length])

   const goNext = useCallback(() => {
      setIndex(i => (i < images.length - 1 ? i + 1 : 0))
   }, [images.length])

   const toggleFit = useCallback((e) => {
      e.stopPropagation()
      setFitMode(m => m === 'height' ? 'width' : 'height')
   }, [])

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

   const imgClass = fitMode === 'height'
      ? 'max-h-[90vh] w-auto'
      : 'max-w-[90vw] h-auto'

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
         onClick={onClose}
      >
         {/* Close button */}
         <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
         >
            <XIcon className="size-6" />
         </button>

         {/* Fit mode indicator */}
         <div className="absolute top-4 right-16 z-10 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
            {fitMode === 'height' ? 'Fit height' : 'Fit width'}
         </div>

         {/* Counter */}
         <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {images.length > 1 && <span>{index + 1} / {images.length}</span>}
            {loading && <Loader2Icon className="size-4 animate-spin" />}
         </div>

         {/* Previous button */}
         {images.length > 1 && (
            <button
               onClick={e => {
                  e.stopPropagation(); goPrev()
               }}
               className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
               aria-label="Previous image"
            >
               <ChevronLeftIcon className="size-6" />
            </button>
         )}

         {/* Scrollable image container */}
         <div
            className="overflow-auto max-h-full max-w-full"
            onClick={e => e.stopPropagation()}
         >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
               src={images[index]}
               alt={`Image ${index + 1} of ${images.length}`}
               className={`${imgClass} cursor-pointer object-contain`}
               onClick={toggleFit}
               title="Click to toggle fit mode"
            />
         </div>

         {/* Next button */}
         {images.length > 1 && (
            <button
               onClick={e => {
                  e.stopPropagation(); goNext()
               }}
               className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
               aria-label="Next image"
            >
               <ChevronRightIcon className="size-6" />
            </button>
         )}
      </div>,
      document.body,
   )
}

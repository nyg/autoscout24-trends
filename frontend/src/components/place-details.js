'use client'

import { useEffect, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { ClockIcon, ExternalLinkIcon, GlobeIcon, PhoneIcon, StarIcon } from 'lucide-react'

const placeCache = new Map()
let optionsSet = false

function ensureApiKey(apiKey) {
   if (!apiKey || optionsSet) {
      return
   }
   setOptions({ key: apiKey, v: 'weekly' })
   optionsSet = true
}

export default function PlaceDetails({ sellerName, zipCode, city, apiKey }) {
   const cacheKey = `${sellerName}|${zipCode}|${city}`
   const cached = placeCache.get(cacheKey) ?? null
   const [place, setPlace] = useState(cached)
   const [loading, setLoading] = useState(!cached)
   const [error, setError] = useState(null)

   useEffect(() => {
      if (place) {
         return
      }

      let cancelled = false

      async function fetchPlace() {
         try {
            ensureApiKey(apiKey)
            const { Place } = await importLibrary('places')

            const query = `${sellerName}, ${zipCode} ${city}`
            const { places } = await Place.searchByText({
               textQuery: query,
               fields: ['id', 'displayName'],
               maxResultCount: 1,
            })

            if (cancelled) {
               return
            }

            if (!places?.length) {
               setError('Place not found')
               setLoading(false)
               return
            }

            const found = places[0]
            await found.fetchFields({
               fields: [
                  'displayName', 'rating', 'userRatingCount',
                  'nationalPhoneNumber', 'websiteURI', 'googleMapsURI',
                  'regularOpeningHours', 'formattedAddress', 'photos',
               ],
            })

            if (cancelled) {
               return
            }

            let photoUrl = null
            if (found.photos?.length) {
               photoUrl = found.photos[0].getURI({ maxWidth: 400, maxHeight: 200 })
            }

            const data = {
               name: found.displayName,
               rating: found.rating,
               totalRatings: found.userRatingCount,
               phone: found.nationalPhoneNumber,
               website: found.websiteURI,
               mapsUrl: found.googleMapsURI,
               address: found.formattedAddress,
               hours: found.regularOpeningHours?.weekdayDescriptions,
               photoUrl,
            }

            placeCache.set(cacheKey, data)
            setPlace(data)
            setLoading(false)
         } catch (err) {
            if (!cancelled) {
               console.error('Error loading place details:', err)
               setError('Failed to load place details')
               setLoading(false)
            }
         }
      }

      fetchPlace()
      return () => {
         cancelled = true
      }
   }, [place, sellerName, zipCode, city, apiKey])

   return (
      <div className="flex flex-col gap-3 text-sm">
         {loading && (
            <div className="flex items-center justify-center py-6">
               <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
         )}

         {error && (
            <p className="py-4 text-center text-muted-foreground">{error}</p>
         )}

         {place && (
            <>
               {place.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                     src={place.photoUrl}
                     alt={place.name}
                     className="h-32 w-full rounded object-cover"
                  />
               )}

               <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{place.name}</span>
                  {place.address && (
                     <span className="text-xs text-muted-foreground">{place.address}</span>
                  )}
               </div>

               {place.rating != null && (
                  <div className="flex items-center gap-1.5">
                     <div className="flex items-center">
                        {renderStars(place.rating)}
                     </div>
                     <span className="text-xs font-medium">{place.rating}</span>
                     {place.totalRatings != null && (
                        <span className="text-xs text-muted-foreground">
                           ({place.totalRatings} reviews)
                        </span>
                     )}
                  </div>
               )}

               {place.phone && (
                  <a
                     href={`tel:${place.phone}`}
                     className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                     <PhoneIcon className="size-3.5 shrink-0" />
                     {place.phone}
                  </a>
               )}

               {place.website && (
                  <a
                     href={place.website}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                     <GlobeIcon className="size-3.5 shrink-0" />
                     <span className="truncate">
                        {place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                     </span>
                  </a>
               )}

               {place.hours && (
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2">
                        <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-medium">Opening hours</span>
                     </div>
                     <ul className="ml-5.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {place.hours.map((line, i) => {
                           const today = new Date().getDay()
                           // Google returns Mon=0..Sun=6, JS getDay() returns Sun=0..Sat=6
                           const isToday = i === (today + 6) % 7
                           return (
                              <li key={i} className={isToday ? 'font-medium text-foreground' : ''}>
                                 {line}
                              </li>
                           )
                        })}
                     </ul>
                  </div>
               )}

               {place.mapsUrl && (
                  <a
                     href={place.mapsUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                     <ExternalLinkIcon className="size-3.5 shrink-0" />
                     View on Google Maps
                  </a>
               )}
            </>
         )}
      </div>
   )
}

function renderStars(rating) {
   const stars = []
   for (let i = 1; i <= 5; i++) {
      const fill = Math.min(1, Math.max(0, rating - (i - 1)))
      stars.push(
         <StarIcon
            key={i}
            className={`size-3.5 ${
               fill >= 0.75
                  ? 'fill-amber-400 text-amber-400'
                  : fill >= 0.25
                     ? 'fill-amber-400/50 text-amber-400'
                     : 'text-muted-foreground/30'
            }`}
         />
      )
   }
   return stars
}

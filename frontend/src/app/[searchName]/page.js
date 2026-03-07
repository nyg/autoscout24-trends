import { Suspense } from 'react'
import Cars from '@/components/cars'
import DailyListingCount from '@/components/daily-listing-count'
import MileagePriceComparison from '@/components/mileage-price-comparison'
import { fetchActiveListings, fetchDailyListingCount, fetchPreviousListings } from '@/lib/data'


export default async function Home({ params }) {

   const awaitedParams = await params
   const searchName = decodeURIComponent(awaitedParams.searchName)

   const cars = fetchActiveListings(searchName)
   const previousListings = fetchPreviousListings(searchName)
   const dailyListingCount = fetchDailyListingCount(searchName)

   return (
      <Suspense fallback={<p>Loading data…</p>}>
         <div className="flex">
            <DailyListingCount data={dailyListingCount} />
            <MileagePriceComparison data={cars} />
         </div>
         <Cars name="Previous listings" data={previousListings} options={{ listingEnded: true }} />
         <Cars name="Active listings" data={cars} />
      </Suspense>
   )
}

import { Suspense } from 'react'
import Cars from '@/components/cars'
import DailyListingCount from '@/components/daily-listing-count'
import MileagePriceComparison from '@/components/mileage-price-comparison'
import { fetchActiveListings, fetchDailyListingCount, fetchPreviousListings } from '@/lib/data'


export default async function Home({ params }) {

   const awaitedParams = await params
   const searchName = decodeURIComponent(awaitedParams.searchName)

   const activeListings = fetchActiveListings(searchName)
   const previousListings = fetchPreviousListings(searchName)
   const dailyListingCount = fetchDailyListingCount(searchName)

   return (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading data…</p>}>
         <div className="flex gap-4">
            <DailyListingCount data={dailyListingCount} />
            <MileagePriceComparison data={activeListings} />
         </div>
         <div className="mt-4 flex flex-col gap-4">
            <Cars name="Active listings" data={activeListings} />
            <Cars name="Previous listings" data={previousListings} options={{ listingEnded: true }} />
         </div>
      </Suspense>
   )
}

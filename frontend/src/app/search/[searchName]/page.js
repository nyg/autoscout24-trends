import { Suspense } from 'react'
import Cars from '@/components/cars'
import DailyListingCount from '@/components/daily-listing-count'
import MileagePriceComparison from '@/components/mileage-price-comparison'
import { fetchActiveListings, fetchConfig, fetchDailyListingCount, fetchPreviousListings } from '@/lib/data'
import { parseAcceptLanguage } from '@/lib/format'
import { headers } from 'next/headers'


export async function generateMetadata({ params }) {
   const { searchName } = await params
   return { title: `${decodeURIComponent(searchName)} – AutoScout24 Trends` }
}

export default async function Home({ params }) {

   const awaitedParams = await params
   const searchName = decodeURIComponent(awaitedParams.searchName)

   const hdrs = await headers()
   const locale = parseAcceptLanguage(hdrs.get('accept-language'))

   const activeListings = fetchActiveListings(searchName)
   const previousListings = fetchPreviousListings(searchName)
   const dailyListingCount = fetchDailyListingCount(searchName)
   const config = await fetchConfig()

   return (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading data…</p>}>
         <div className="flex gap-4">
            <DailyListingCount data={dailyListingCount} />
            <MileagePriceComparison data={activeListings} />
         </div>
         <div className="mt-4 flex flex-col gap-4">
            <Cars name="Active listings" data={activeListings} config={config} locale={locale} />
            <Cars name="Previous listings" data={previousListings} options={{ listingEnded: true }} config={config} locale={locale} />
         </div>
      </Suspense>
   )
}

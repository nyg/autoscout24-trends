import { Suspense } from 'react'

import Cars from '@/components/cars'
import DailyListingCount from '@/components/daily-listing-count'
import MileagePriceComparison from '@/components/mileage-price-comparison'
import PriceHistory from '@/components/price-history'
import SearchTabs from '@/components/search-tabs'
import { fetchActiveListings, fetchConfig, fetchDailyListingCount, fetchPreviousListings, fetchPriceChangedListings } from '@/lib/data'

const VALID_TABS = ['active', 'previous', 'history']

export async function generateMetadata({ params }) {
   const { searchName } = await params
   return { title: `${decodeURIComponent(searchName)} – AutoScout24 Trends` }
}

export default async function Home({ params, searchParams }) {

   const awaitedParams = await params
   const searchName = decodeURIComponent(awaitedParams.searchName)

   const { tab: tabParam } = await searchParams
   const tab = VALID_TABS.includes(tabParam) ? tabParam : 'active'

   const config = await fetchConfig()

   const activeListings = tab === 'active' ? fetchActiveListings(searchName) : null
   const dailyListingCount = tab === 'active' ? fetchDailyListingCount(searchName) : null
   const previousListings = tab === 'previous' ? fetchPreviousListings(searchName) : null
   const priceChangedListings = tab === 'history' ? fetchPriceChangedListings(searchName) : null

   return (
      <>
         <SearchTabs searchName={searchName} currentTab={tab} />
         <Suspense fallback={<p className="mt-4 text-sm text-muted-foreground">Loading data…</p>}>
            {tab === 'active' && (
               <>
                  <div className="mt-4 flex gap-4">
                     <DailyListingCount data={dailyListingCount} />
                     <MileagePriceComparison data={activeListings} />
                  </div>
                  <div className="mt-4">
                     <Cars name="Active listings" data={activeListings} config={config} />
                  </div>
               </>
            )}
            {tab === 'previous' && (
               <div className="mt-4">
                  <Cars name="Previous listings" data={previousListings} options={{ listingEnded: true }} config={config} />
               </div>
            )}
            {tab === 'history' && (
               <div className="mt-4">
                  <PriceHistory data={priceChangedListings} />
               </div>
            )}
         </Suspense>
      </>
   )
}

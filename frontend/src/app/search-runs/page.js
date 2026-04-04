import { Suspense } from 'react'
import SearchRuns from '@/components/search-runs'
import { fetchSearchNames, fetchSearchRuns } from '@/lib/data'
import { parseAcceptLanguage } from '@/lib/format'
import { headers } from 'next/headers'


export const metadata = { title: 'Search Runs – AutoScout24 Trends' }

export default async function SearchRunsPage() {

   const hdrs = await headers()
   const locale = parseAcceptLanguage(hdrs.get('accept-language'))

   const searches = fetchSearchNames()
   const searchRuns = fetchSearchRuns()

   return (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading search runs…</p>}>
         <SearchRuns data={searchRuns} searches={searches} locale={locale} />
      </Suspense>
   )
}

import { Suspense } from 'react'

import SearchRuns from '@/components/search-runs'
import { fetchSearchNames, fetchSearchRuns, fetchSearchRunsCount } from '@/lib/data'


export const metadata = { title: 'Search Runs – AutoScout24 Trends' }

const PAGE_SIZE = 25

export default async function SearchRunsPage({ searchParams }) {

   const { page: pageParam, search } = await searchParams
   const page = Math.max(1, parseInt(pageParam, 10) || 1)
   const searchName = search || null

   const searches = fetchSearchNames()
   const searchRuns = fetchSearchRuns(searchName, page, PAGE_SIZE)
   const totalCount = fetchSearchRunsCount(searchName)

   return (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading search runs…</p>}>
         <SearchRuns
            data={searchRuns}
            searches={searches}
            totalCount={totalCount}
            page={page}
            pageSize={PAGE_SIZE}
            searchFilter={searchName}
         />
      </Suspense>
   )
}

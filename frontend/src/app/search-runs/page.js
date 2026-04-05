import { Suspense } from 'react'

import SearchRuns from '@/components/search-runs'
import { fetchSearchNames, fetchSearchRuns, fetchSearchRunsCount } from '@/lib/data'


export const metadata = { title: 'Search Runs – AutoScout24 Trends' }

const DEFAULT_PAGE_SIZE = 20
const VALID_PAGE_SIZES = [10, 20, 50, 100]

function defaultFrom() {
   const d = new Date()
   d.setDate(d.getDate() - 7)
   return d.toISOString().slice(0, 10)
}

function defaultTo() {
   return new Date().toISOString().slice(0, 10)
}

export default async function SearchRunsPage({ searchParams }) {

   const params = await searchParams
   const page = Math.max(1, parseInt(params.page, 10) || 1)
   const searchName = params.search || null
   const pageSize = VALID_PAGE_SIZES.includes(Number(params.pageSize))
      ? Number(params.pageSize)
      : DEFAULT_PAGE_SIZE
   const fromDate = params.from || defaultFrom()
   const toDate = params.to || defaultTo()

   const searches = fetchSearchNames()
   const searchRuns = fetchSearchRuns(searchName, page, pageSize, fromDate, toDate)
   const totalCount = fetchSearchRunsCount(searchName, fromDate, toDate)

   return (
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading search runs…</p>}>
         <SearchRuns
            data={searchRuns}
            searches={searches}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            searchFilter={searchName}
            fromDate={fromDate}
            toDate={toDate}
         />
      </Suspense>
   )
}

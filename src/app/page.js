import postgres from 'postgres'
import { Suspense } from 'react'
import Cars from '@/components/cars'
import DailyListingCount from '@/components/daily-listing-count'
import MileagePriceComparison from '@/components/mileage-price-comparison'
import Link from 'next/link'


export default async function Home() {

   const pgSql = postgres(process.env.PGSQL_URL)

   const searchName = 'RS4 B9'
   // const searchName = 'Mazda MX-5'

   const cars = pgSql`
      with cars_with_batch_number as (
               select *,
                      row_number() over (partition by vehicle_id order by date_in desc) as reverse_batch_number
                 from cars
                where search_name = ${searchName}),
           last_appearance_by_car as (
               select *,
                      date_trunc('day', date_in) = (select max(date_trunc('day', date_in)) from cars_with_batch_number) last_batch
                 from cars_with_batch_number
                where reverse_batch_number = 1)
      select c.*,
             s.type seller_type, s.name seller_name, s.address seller_address, s.zip_code, s.city,
             365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
        from last_appearance_by_car c
       inner join sellers s on c.seller_id = s.id`

   const dailyListingCount = pgSql`
      select extract(epoch from date_trunc('day', date_in))::bigint * 1000 date,
             count(*)::int car_count,
             avg(price) price_avg,
             avg(mileage) mileage_avg
        from cars
       where search_name = ${searchName}
       group by date_trunc('day', date_in)
       order by date_trunc('day', date_in)`

   const searches = await pgSql`select distinct(search_name) name from cars`
   const previousListings = cars.then(cars => cars.filter(car => !car.last_batch).sort((a, b) => a.date_in - b.date_in))
   const activeListings = cars.then(cars => cars.filter(car => car.last_batch).sort((a, b) => a.price - b.price))

   return (
      <div className="prose prose-sm max-w-full">
         <div className="navbar bg-base-300 drop-shadow px-4">
            <div className="navbar-start">
               <span className="text-lg font-semibold">AutoScout Visualizer</span>
            </div>
            <div className="navbar-center space-x-4">
               {searches.map(search => (
                  <Link key={search.name} href={`?${search.name}`}>{search.name}</Link>
               ))}
            </div>
            <div className="navbar-end">
               <a href="https://github.com/nyg/autoscout-visualizer" target="_blank">Github</a>
            </div>
         </div>
         <div className="px-4">
            <Suspense fallback={<div>Loading…</div>}>
               <div className="flex">
                  <DailyListingCount data={dailyListingCount} />
                  <MileagePriceComparison data={activeListings} />
               </div>
               <Cars name="Previous listings" data={previousListings} options={{ listingEnded: true }} />
               <Cars name="Active listings" data={activeListings} />
            </Suspense>
         </div>
      </div>
   )
}

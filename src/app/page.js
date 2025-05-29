import postgres from 'postgres'
import { Suspense } from 'react'
import Cars from '@/components/cars'


export default async function Home() {

   const pgSql = postgres(process.env.PGSQL_URL)

   const cars = pgSql`
      with cars_with_batch_number as (
               select *,
                      row_number() over (partition by vehicle_id order by date_in desc) as reverse_batch_number
                 from cars
                where search_name = 'RS4 B9'),
           last_appearance_by_car as (
               select *,
                      date_trunc('day', date_in) = (select max(date_trunc('day', date_in)) from cars_with_batch_number) last_batch
                 from cars_with_batch_number
                where reverse_batch_number = 1)
      select c.*,
             s.*,
             365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
        from last_appearance_by_car c
       inner join sellers s on c.seller_id = s.id`

   const previousListings = cars.then(cars => cars.filter(car => !car.last_batch).sort((a, b) => a.created_date - b.created_date))
   const activeListings = cars.then(cars => cars.filter(car => car.last_batch))

   const searches = await pgSql`select distinct(search_name) name from cars`

   return (
      <div className="prose prose-sm max-w-full">
         <div className="navbar bg-base-300 drop-shadow px-4">
            <div className="navbar-start">
               <span className="text-lg font-semibold">AutoScout Visualizer</span>
            </div>
            <div className="navbar-center">
               {searches.map(search => (
                  <a key={search.name}>{search.name}</a>
               ))}
            </div>
            <div className="navbar-end">
               <a href="https://github.com/nyg/autoscout-visualizer" target="_blank">Github</a>
            </div>
         </div>
         <div className="px-4">
            <Suspense fallback={<div>Loading…</div>}>
               <Cars name="Previous listings" carPromise={previousListings} />
               <Cars name="Active listings" carPromise={activeListings} />
            </Suspense>
         </div>
      </div>
   )
}

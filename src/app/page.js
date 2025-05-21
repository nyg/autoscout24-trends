import postgres from 'postgres'
import { Suspense } from 'react'
import Cars from '@/components/cars'


export default function Home() {
   const pgSql = postgres(process.env.PGSQL_URL)
   const cars = pgSql`
      select c.*,
             s.*,
             365.25 * mileage / extract(day from current_timestamp - first_registration_date) as km_year
        from cars c
       inner join sellers s on c.seller_id = s.id
       where search_name = 'RS4 B9'
         and date_in >= (select date_trunc('day', max(date_in))
                           from cars
                          where search_name = 'RS4 B9')
       order by created_date, mileage`

   return (
      <div className="p-4">
         <Suspense fallback={<div>Loading...</div>}>
            <Cars carPromise={cars} />
         </Suspense>
      </div>
   )
}

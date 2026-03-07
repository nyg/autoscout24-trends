import { noStore } from 'next/cache'
import postgres from 'postgres'

const pgSql = postgres(process.env.PGSQL_URL)

export async function fetchActiveListings(searchName) {
   return pgSql`
      select c.*,
             s.type seller_type, s.name seller_name, s.address seller_address, s.zip_code, s.city,
             365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
        from cars c
       inner join sellers s on c.seller_id = s.id
       where c.batch_id = (select max(batch_id) from cars where search_name = ${searchName})
       order by c.price`
}

export async function fetchPreviousListings(searchName) {
   return pgSql`
      with latest_batch as (
         select max(batch_id) batch_id from cars where search_name = ${searchName}
      )
      select * from (
         select distinct on (c.vehicle_id) c.*,
                s.type seller_type, s.name seller_name, s.address seller_address, s.zip_code, s.city,
                365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
           from cars c
          inner join sellers s on c.seller_id = s.id
          where c.search_name = ${searchName}
            and not exists (
                select 1 from cars l
                 where l.search_name = ${searchName}
                   and l.batch_id = (select batch_id from latest_batch)
                   and l.vehicle_id = c.vehicle_id
            )
          order by c.vehicle_id, c.batch_id desc
      ) as prev
      order by price`
}

export async function fetchDailyListingCount(searchName) {
   return pgSql`
      select extract(epoch from date_trunc('day', date_in))::bigint * 1000 date,
             count(*)::int car_count,
             avg(price) price_avg,
             avg(mileage) mileage_avg
        from cars
       where search_name = ${searchName}
       group by date
       order by date`
}

export async function fetchSearchNames() {
   noStore()
   return pgSql`select distinct(search_name) name from cars order by search_name`
}

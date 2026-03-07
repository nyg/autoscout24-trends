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
      select c.*,
             s.type seller_type, s.name seller_name, s.address seller_address, s.zip_code, s.city,
             365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
        from cars c
       inner join sellers s on c.seller_id = s.id
       where c.batch_id = (select max(batch_id) from cars where search_name = ${searchName})
       order by c.price`
}

export async function fetchDailyListingCount(searchName) {
   return pgSql`
      select extract(epoch from date_trunc('day', date_in))::bigint * 1000 date,
             count(*)::int car_count,
             avg(price) price_avg,
             avg(mileage) mileage_avg
        from cars
       where search_name = ${searchName}
       group by date_trunc('day', date_in)
       order by date_trunc('day', date_in)`
}

export async function fetchSearchNames() {
   return pgSql`select distinct(search_name) name from cars order by search_name`
}

import postgres from 'postgres'

const pgSql = postgres(process.env.PGSQL_URL)

export async function fetchSearches() {
   return pgSql`select * from searches order by name`
}

export async function fetchSearchNames() {
   return pgSql`select id, name from searches order by name`
}

export async function fetchActiveListings(searchName) {
   return pgSql`
      select c.*,
             se.type seller_type, se.name seller_name, se.address seller_address, se.zip_code, se.city,
             365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
        from cars c
       inner join sellers se on c.seller_id = se.id
       inner join searches s on c.search_id = s.id
       where c.search_run_id = (
          select max(c2.search_run_id)
            from cars c2
           inner join searches s2 on c2.search_id = s2.id
           where s2.name = ${searchName}
       )
       order by c.price`
}

export async function fetchPreviousListings(searchName) {
   return pgSql`
      with latest_run as (
         select max(c2.search_run_id) search_run_id
           from cars c2
          inner join searches s2 on c2.search_id = s2.id
          where s2.name = ${searchName}
      )
      select * from (
         select distinct on (c.vehicle_id) c.*,
                se.type seller_type, se.name seller_name, se.address seller_address, se.zip_code, se.city,
                365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year
           from cars c
          inner join sellers se on c.seller_id = se.id
          inner join searches s on c.search_id = s.id
          where s.name = ${searchName}
            and not exists (
                select 1 from cars l
                 inner join searches ls on l.search_id = ls.id
                 where ls.name = ${searchName}
                   and l.search_run_id = (select search_run_id from latest_run)
                   and l.vehicle_id = c.vehicle_id
            )
          order by c.vehicle_id, c.search_run_id desc
      ) as prev
      order by price`
}

export async function fetchSearchRuns(searchName) {
   const filter = searchName
      ? pgSql`where s.name = ${searchName}`
      : pgSql``
   return pgSql`
      select sr.id, s.name search_name,
             sr.started_at, sr.finished_at,
             sr.finish_reason, sr.success,
             sr.cars_found, sr.cars_scraped,
             sr.request_count, sr.failed_request_count
        from search_runs sr
       inner join searches s on sr.search_id = s.id
       ${filter}
       order by sr.started_at desc`
}

export async function fetchDailyListingCount(searchName) {
   return pgSql`
      select extract(epoch from date_trunc('day', date_in))::bigint * 1000 date,
             count(*)::int car_count,
             avg(price) price_avg,
             avg(mileage) mileage_avg
        from cars c
       inner join searches s on c.search_id = s.id
       where s.name = ${searchName}
       group by date
       order by date`
}

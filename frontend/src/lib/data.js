import postgres from 'postgres'

const pgSql = postgres(process.env.PGSQL_URL)

export async function fetchSearches() {
   return pgSql`select * from searches order by name`
}

export async function fetchSearchNames() {
   return pgSql`select id, name from searches order by name`
}

export async function fetchConfig() {
   try {
      const rows = await pgSql`select key, value from config`
      return Object.fromEntries(rows.map(r => [r.key, r.value]))
   } catch {
      return {}
   }
}

export async function fetchActiveListings(searchName) {
   return pgSql`
      select c.id, c.search_id, c.url, c.date_in, c.title, c.subtitle, c.description,
             c.vehicle_id, c.seller_vehicle_id, c.certification_number, c.price, c.body_type,
             c.color, c.mileage, c.has_additional_set_of_tires, c.had_accident, c.fuel_type,
             c.kilo_watts, c.cm3, c.cylinders, c.cylinder_layout, c.avg_consumption, c.co2_emission,
             c.warranty, c.leasing, c.created_date, c.last_modified_date, c.first_registration_date,
             c.last_inspection_date, c.seller_id, c.search_run_id,
             se.type seller_type, se.name seller_name, se.address seller_address, se.zip_code, se.city,
             365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year,
             sc.r2_url as screenshot_url
        from cars c
       inner join sellers se on c.seller_id = se.id
       inner join searches s on c.search_id = s.id
        left join screenshots sc on c.screenshot_id = sc.id
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
         select distinct on (c.vehicle_id)
                c.id, c.search_id, c.url, c.date_in, c.title, c.subtitle, c.description,
                c.vehicle_id, c.seller_vehicle_id, c.certification_number, c.price, c.body_type,
                c.color, c.mileage, c.has_additional_set_of_tires, c.had_accident, c.fuel_type,
                c.kilo_watts, c.cm3, c.cylinders, c.cylinder_layout, c.avg_consumption, c.co2_emission,
                c.warranty, c.leasing, c.created_date, c.last_modified_date, c.first_registration_date,
                c.last_inspection_date, c.seller_id, c.search_run_id,
                se.type seller_type, se.name seller_name, se.address seller_address, se.zip_code, se.city,
                365.25 * mileage / extract(day from current_timestamp - c.first_registration_date) as km_year,
                sc.r2_url as screenshot_url
           from cars c
          inner join sellers se on c.seller_id = se.id
          inner join searches s on c.search_id = s.id
           left join screenshots sc on c.screenshot_id = sc.id
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

export async function fetchSearchRuns(searchName, page = 1, pageSize = 20, fromDate, toDate) {
   const conditions = []
   if (searchName) {
      conditions.push(pgSql`s.name = ${searchName}`)
   }
   if (fromDate) {
      conditions.push(pgSql`sr.started_at >= ${fromDate}`)
   }
   if (toDate) {
      conditions.push(pgSql`sr.started_at < ${toDate}::date + interval '1 day'`)
   }
   const where = conditions.length > 0
      ? pgSql`where ${conditions.reduce((a, b) => pgSql`${a} and ${b}`)}`
      : pgSql``
   const offset = (page - 1) * pageSize
   return pgSql`
      select sr.id, s.name search_name,
             sr.started_at, sr.finished_at,
             sr.finish_reason, sr.success,
             sr.cars_found, sr.cars_scraped,
             sr.request_count, sr.failed_request_count,
             sr.stats
        from search_runs sr
       inner join searches s on sr.search_id = s.id
       ${where}
       order by sr.started_at desc
       limit ${pageSize} offset ${offset}`
}

export async function fetchSearchRunsCount(searchName, fromDate, toDate) {
   const conditions = []
   if (searchName) {
      conditions.push(pgSql`s.name = ${searchName}`)
   }
   if (fromDate) {
      conditions.push(pgSql`sr.started_at >= ${fromDate}`)
   }
   if (toDate) {
      conditions.push(pgSql`sr.started_at < ${toDate}::date + interval '1 day'`)
   }
   const where = conditions.length > 0
      ? pgSql`where ${conditions.reduce((a, b) => pgSql`${a} and ${b}`)}`
      : pgSql``
   const [row] = await pgSql`
      select count(*)::int as total
        from search_runs sr
       inner join searches s on sr.search_id = s.id
       ${where}`
   return row.total
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

export async function fetchCarScreenshotUrl(carId) {
   const [row] = await pgSql`
      select sc.r2_url
        from cars c
        left join screenshots sc on c.screenshot_id = sc.id
       where c.id = ${carId}`
   return row?.r2_url ?? null
}



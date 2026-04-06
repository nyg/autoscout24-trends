'use server'

import { revalidatePath } from 'next/cache'
import postgres from 'postgres'

import { deleteR2Objects } from '@/lib/r2'

const pgSql = postgres(process.env.PGSQL_URL)

async function collectOrphanedScreenshots(pgSql, screenshotIds, excludeCarIds) {
   if (screenshotIds.length === 0) {
      return []
   }
   const referenced = await pgSql`
      select distinct screenshot_id
        from cars
       where screenshot_id in ${pgSql(screenshotIds)}
         ${excludeCarIds.length > 0 ? pgSql`and id not in ${pgSql(excludeCarIds)}` : pgSql``}`
   const referencedSet = new Set(referenced.map(r => r.screenshot_id))
   return screenshotIds.filter(id => !referencedSet.has(id))
}

async function deleteOrphanedScreenshots(pgSql, orphanIds) {
   if (orphanIds.length === 0) {
      return
   }
   const rows = await pgSql`
      select r2_key from screenshots where id in ${pgSql(orphanIds)}`
   await pgSql`delete from screenshots where id in ${pgSql(orphanIds)}`
   const keys = rows.map(r => r.r2_key).filter(Boolean)
   await deleteR2Objects(keys)
}

export async function createSearch(prevState, formData) {
   const name = formData.get('name')?.toString().trim()
   const url = formData.get('url')?.toString().trim()

   if (!name || !url) {
      return { error: 'Name and URL are required.' }
   }

   try {
      await pgSql`
         insert into searches (name, url)
         values (${name}, ${url})`
      revalidatePath('/', 'layout')
      return { success: true }
   } catch (e) {
      if (e.code === '23505') {
         return { error: 'A search with this name already exists.' }
      }
      return { error: 'Failed to create search.' }
   }
}

export async function updateSearch(prevState, formData) {
   const id = parseInt(formData.get('id'), 10)
   const name = formData.get('name')?.toString().trim()
   const url = formData.get('url')?.toString().trim()
   const isActive = formData.get('is_active') === 'true'

   if (!name || !url) {
      return { error: 'Name and URL are required.' }
   }

   try {
      await pgSql`
         update searches
            set name = ${name},
                url = ${url},
                is_active = ${isActive},
                updated_at = current_timestamp
          where id = ${id}`
      revalidatePath('/', 'layout')
      return { success: true }
   } catch (e) {
      if (e.code === '23505') {
         return { error: 'A search with this name already exists.' }
      }
      return { error: 'Failed to update search.' }
   }
}

export async function deleteSearch(prevState, formData) {
   const id = parseInt(formData.get('id'), 10)
   const confirmed = formData.get('confirmed') === 'true'

   try {
      const [info] = await pgSql`
         select (select count(*)::int from search_runs where search_id = ${id}) as run_count,
                (select count(*)::int from cars where search_id = ${id}) as car_count,
                (select count(distinct c.screenshot_id) filter (where c.screenshot_id is not null)::int
                   from cars c where c.search_id = ${id}) as screenshot_count`

      if ((info.car_count > 0 || info.run_count > 0) && !confirmed) {
         return {
            needsConfirm: true,
            runCount: info.run_count,
            carCount: info.car_count,
            screenshotCount: info.screenshot_count,
         }
      }

      const screenshotIds = (await pgSql`
         select distinct screenshot_id from cars
          where search_id = ${id} and screenshot_id is not null`
      ).map(r => r.screenshot_id)

      const carIds = (await pgSql`
         select id from cars where search_id = ${id}`
      ).map(r => r.id)

      const orphanIds = await collectOrphanedScreenshots(pgSql, screenshotIds, carIds)

      // Collect R2 keys before deleting from DB
      let r2Keys = []
      if (orphanIds.length > 0) {
         r2Keys = (await pgSql`
            select r2_key from screenshots where id in ${pgSql(orphanIds)}`
         ).map(r => r.r2_key).filter(Boolean)
      }

      await pgSql.begin(async pgSql => {
         await pgSql`update cars set screenshot_id = null where search_id = ${id} and screenshot_id is not null`
         await pgSql`delete from cars where search_id = ${id}`
         if (orphanIds.length > 0) {
            await pgSql`delete from screenshots where id in ${pgSql(orphanIds)}`
         }
         await pgSql`delete from search_runs where search_id = ${id}`
         await pgSql`delete from searches where id = ${id}`
      })

      await deleteR2Objects(r2Keys)
      revalidatePath('/', 'layout')
      return { success: true }
   } catch {
      return { error: 'Failed to delete search.' }
   }
}

export async function toggleSearchActive(prevState, formData) {
   const id = parseInt(formData.get('id'), 10)
   const isActive = formData.get('is_active') === 'true'

   try {
      await pgSql`
         update searches
            set is_active = ${isActive},
                updated_at = current_timestamp
          where id = ${id}`
      revalidatePath('/', 'layout')
      return { success: true }
   } catch {
      return { error: 'Failed to update search.' }
   }
}

export async function deleteSearchRun(prevState, formData) {
   const id = parseInt(formData.get('id'), 10)
   const confirmed = formData.get('confirmed') === 'true'

   try {
      if (!confirmed) {
         const [info] = await pgSql`
            select count(c.id)::int as car_count,
                   count(distinct c.screenshot_id) filter (where c.screenshot_id is not null)::int as screenshot_count
              from cars c
             where c.search_run_id = ${id}`
         return {
            needsConfirm: true,
            carCount: info.car_count,
            screenshotCount: info.screenshot_count,
         }
      }

      const screenshotIds = (await pgSql`
         select distinct screenshot_id from cars
          where search_run_id = ${id} and screenshot_id is not null`
      ).map(r => r.screenshot_id)

      const carIds = (await pgSql`
         select id from cars where search_run_id = ${id}`
      ).map(r => r.id)

      const orphanIds = await collectOrphanedScreenshots(pgSql, screenshotIds, carIds)

      let r2Keys = []
      if (orphanIds.length > 0) {
         r2Keys = (await pgSql`
            select r2_key from screenshots where id in ${pgSql(orphanIds)}`
         ).map(r => r.r2_key).filter(Boolean)
      }

      await pgSql.begin(async pgSql => {
         await pgSql`update cars set screenshot_id = null where search_run_id = ${id} and screenshot_id is not null`
         await pgSql`delete from cars where search_run_id = ${id}`
         if (orphanIds.length > 0) {
            await pgSql`delete from screenshots where id in ${pgSql(orphanIds)}`
         }
         await pgSql`delete from search_runs where id = ${id}`
      })

      await deleteR2Objects(r2Keys)
      revalidatePath('/search-runs')
      return { success: true }
   } catch {
      return { error: 'Failed to delete search run.' }
   }
}

export async function updateConfig(prevState, formData) {
   const entries = []
   for (const [key, value] of formData.entries()) {
      if (key.startsWith('config:')) {
         entries.push({ key: key.slice('config:'.length), value: value.toString().trim() })
      }
   }

   if (entries.length === 0) {
      return { error: 'No config values provided.' }
   }

   try {
      await pgSql.begin(async pgSql => {
         for (const { key, value } of entries) {
            await pgSql`
               insert into config (key, value) values (${key}, ${value})
               on conflict (key) do update set value = ${value}`
         }
      })
      revalidatePath('/settings')
      return { success: true }
   } catch {
      return { error: 'Failed to save settings.' }
   }
}

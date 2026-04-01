'use server'

import postgres from 'postgres'
import { revalidatePath } from 'next/cache'

const pgSql = postgres(process.env.PGSQL_URL)

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
      const [row] = await pgSql`
         select count(*)::int as count from cars where search_id = ${id}`

      if (row.count > 0 && !confirmed) {
         return { needsConfirm: true, carCount: row.count }
      }

      await pgSql.begin(async pgSql => {
         await pgSql`delete from cars where search_id = ${id}`
         await pgSql`delete from searches where id = ${id}`
      })
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

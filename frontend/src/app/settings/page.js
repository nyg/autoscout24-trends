import ClientSettings from '@/components/client-settings'
import { fetchSearches } from '@/lib/data'
import SearchManager from '@/components/search-manager'

export default async function SettingsPage() {
   const searches = await fetchSearches()

   return (
      <div className="mx-auto flex max-w-screen-sm flex-col gap-4">
         <SearchManager searches={searches} />
         <ClientSettings />
      </div>
   )
}

import ClientSettings from '@/components/client-settings'
import { fetchConfig, fetchSearches } from '@/lib/data'
import SearchManager from '@/components/search-manager'

export default async function SettingsPage() {
   const searches = await fetchSearches()
   const config = await fetchConfig()

   return (
      <div className="mx-auto flex max-w-screen-md flex-col gap-4">
         <SearchManager searches={searches} />
         <ClientSettings config={config} />
      </div>
   )
}

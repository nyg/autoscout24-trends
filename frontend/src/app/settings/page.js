'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const MAPS_KEY_STORAGE_KEY = 'google-maps-api-key'
const HOME_ADDRESS_STORAGE_KEY = 'home-address'

export default function SettingsPage() {
   const [apiKey, setApiKey] = useState(() => {
      if (typeof window === 'undefined') {
         return ''
      }
      return localStorage.getItem(MAPS_KEY_STORAGE_KEY) || ''
   })
   const [homeAddress, setHomeAddress] = useState(() => {
      if (typeof window === 'undefined') {
         return ''
      }
      return localStorage.getItem(HOME_ADDRESS_STORAGE_KEY) || ''
   })
   const [saved, setSaved] = useState(false)

   function handleSave() {
      localStorage.setItem(MAPS_KEY_STORAGE_KEY, apiKey.trim())
      localStorage.setItem(HOME_ADDRESS_STORAGE_KEY, homeAddress.trim())
      window.dispatchEvent(new Event('home-address-changed'))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
   }

   function handleKeyDown(e) {
      if (e.key === 'Enter') {
         handleSave()
      }
   }

   return (
      <div className="mx-auto max-w-screen-sm">
         <Card>
            <CardHeader>
               <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
               <div className="flex flex-col gap-2">
                  <label htmlFor="maps-api-key" className="text-sm font-medium">
                     Google Maps API Key
                  </label>
                  <p className="text-xs text-muted-foreground">
                     Used to display seller details from Google Maps.
                     Get an API key from the{' '}
                     <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                     >
                        Google Cloud Console
                     </a>
                     {' '}and enable the <strong>Maps JavaScript API</strong> and <strong>Places API (New)</strong>.
                  </p>
                  <input
                     id="maps-api-key"
                     type="text"
                     value={apiKey}
                     onChange={e => setApiKey(e.target.value)}
                     onKeyDown={handleKeyDown}
                     placeholder="Enter your API key"
                     className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label htmlFor="home-address" className="text-sm font-medium">
                     Home Address
                  </label>
                  <p className="text-xs text-muted-foreground">
                     Used to show directions from your home to car sellers.
                     Enter a full address (e.g. &ldquo;Bahnhofstrasse 1, 8001 Zürich&rdquo;).
                  </p>
                  <input
                     id="home-address"
                     type="text"
                     value={homeAddress}
                     onChange={e => setHomeAddress(e.target.value)}
                     onKeyDown={handleKeyDown}
                     placeholder="Enter your home address"
                     className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
               </div>

               <button
                  onClick={handleSave}
                  className="self-end rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
               >
                  {saved ? '✓ Saved' : 'Save'}
               </button>
            </CardContent>
         </Card>
      </div>
   )
}

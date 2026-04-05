'use client'

import { useActionState, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSearch, deleteSearch, toggleSearchActive, updateSearch } from '@/lib/actions'

function SearchRow({ search }) {
   const [editing, setEditing] = useState(false)
   const [, submitUpdate, updatingPending] = useActionState(async (prev, formData) => {
      const result = await updateSearch(prev, formData)
      if (result.success) {
         setEditing(false)
      }
      return result
   }, null)
   const [deleteState, submitDelete, deletePending] = useActionState(deleteSearch, null)
   const [, submitToggle] = useActionState(toggleSearchActive, null)

   if (editing) {
      return (
         <tr className="border-b">
            <td colSpan={5} className="p-2">
               <form action={submitUpdate} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={search.id} />
                  <input type="hidden" name="is_active" value={String(search.is_active)} />
                  <input
                     name="name"
                     defaultValue={search.name}
                     placeholder="Search name"
                     className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                     name="url"
                     defaultValue={search.url}
                     placeholder="AutoScout24 URL"
                     className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2 justify-end">
                     <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-muted"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={updatingPending}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                     >
                        {updatingPending ? 'Saving…' : 'Save'}
                     </button>
                  </div>
               </form>
            </td>
         </tr>
      )
   }

   return (
      <tr className="border-b text-sm font-medium">
         <td className="p-2 text-muted-foreground whitespace-nowrap">{search.id}</td>
         <td className="p-2 whitespace-nowrap">{search.name}</td>
         <td className="p-2 text-muted-foreground truncate max-w-0" title={search.url}>
            {search.url}
         </td>
         <td className="p-2 text-center whitespace-nowrap">
            <form action={submitToggle} className="inline">
               <input type="hidden" name="id" value={search.id} />
               <input type="hidden" name="is_active" value={String(!search.is_active)} />
               <button
                  type="submit"
                  className={`inline-flex size-4 items-center justify-center rounded-sm border text-xs transition-colors ${
                     search.is_active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                  }`}
                  title={search.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
               >
                  {search.is_active ? '✓' : ''}
               </button>
            </form>
         </td>
         <td className="p-2 text-right whitespace-nowrap">
            <div className="flex gap-1 justify-end items-center">
               {deleteState?.needsConfirm ? (
                  <form action={submitDelete} className="inline-flex items-center gap-1" role="alert">
                     <input type="hidden" name="id" value={search.id} />
                     <input type="hidden" name="confirmed" value="true" />
                     <span className="text-xs text-destructive">
                        Also delete {deleteState.carCount} car{deleteState.carCount !== 1 ? 's' : ''}?
                     </span>
                     <button
                        type="submit"
                        disabled={deletePending}
                        className="rounded-md border border-destructive/30 px-2 py-0.5 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                     >
                        {deletePending ? '…' : 'Confirm'}
                     </button>
                  </form>
               ) : (
                  <>
                     <button
                        onClick={() => setEditing(true)}
                        className="rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                     >
                        Edit
                     </button>
                     <form action={submitDelete} className="inline">
                        <input type="hidden" name="id" value={search.id} />
                        <button
                           type="submit"
                           disabled={deletePending}
                           className="rounded-md border border-destructive/30 px-2 py-0.5 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                        >
                           {deletePending ? '…' : 'Delete'}
                        </button>
                     </form>
                     {deleteState?.error && (
                        <span className="text-xs text-destructive">{deleteState.error}</span>
                     )}
                  </>
               )}
            </div>
         </td>
      </tr>
   )
}

function AddSearchForm() {
   const [state, submitAction, pending] = useActionState(createSearch, null)

   return (
      <form action={submitAction} className="flex flex-col gap-2 pt-4">
         <p className="text-sm font-medium">Add new search</p>
         <input
            name="name"
            placeholder="Search name (e.g. Audi RS6 Avant)"
            required
            className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
         />
         <input
            name="url"
            placeholder="AutoScout24 search URL"
            required
            className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
         />
         {state?.error && (
            <p className="text-xs text-destructive">{state.error}</p>
         )}
         <button
            type="submit"
            disabled={pending}
            className="self-end rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
         >
            {pending ? 'Adding…' : 'Add search'}
         </button>
      </form>
   )
}

export default function SearchManager({ searches }) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Searches</CardTitle>
         </CardHeader>
         <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
               Manage your AutoScout24 search configurations. Active searches will be crawled on the next scheduled run.
            </p>
            {searches.length > 0 ? (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b text-xs font-medium text-muted-foreground">
                        <th className="p-2 whitespace-nowrap">ID</th>
                        <th className="p-2 whitespace-nowrap">Name</th>
                        <th className="p-2 w-full">URL</th>
                        <th className="p-2 text-center whitespace-nowrap">Active</th>
                        <th className="p-2 text-right whitespace-nowrap">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {searches.map(search => (
                        <SearchRow key={search.id} search={search} />
                     ))}
                  </tbody>
               </table>
            ) : (
               <p className="text-sm text-muted-foreground">No searches configured yet.</p>
            )}
            <AddSearchForm />
         </CardContent>
      </Card>
   )
}

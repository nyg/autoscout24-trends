'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'

import {
   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
   AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSearch, deleteSearch, toggleSearchActive, updateSearch } from '@/lib/actions'


function CopyUrlButton({ url }) {
   const [copied, setCopied] = useState(false)

   const handleCopy = async () => {
      try {
         await navigator.clipboard.writeText(url)
         setCopied(true)
         setTimeout(() => setCopied(false), 1500)
      } catch { /* ignore */ }
   }

   return (
      <button
         onClick={handleCopy}
         className="text-muted-foreground hover:text-foreground transition-colors"
         title="Copy URL"
         aria-label="Copy URL to clipboard"
      >
         {copied
            ? <CheckIcon className="size-3.5 text-green-600" />
            : <CopyIcon className="size-3.5" />
         }
      </button>
   )
}

function SearchRow({ search }) {
   const [editing, setEditing] = useState(false)
   const [, submitUpdate, updatingPending] = useActionState(async (prev, formData) => {
      const result = await updateSearch(prev, formData)
      if (result.success) {
         setEditing(false)
      }
      return result
   }, null)
   const [, submitToggle] = useActionState(toggleSearchActive, null)

   const [dialogOpen, setDialogOpen] = useState(false)
   const [deleteInfo, setDeleteInfo] = useState(null)
   const [deletePending, startDeleteTransition] = useTransition()
   const [deleteError, setDeleteError] = useState(null)

   const handleDelete = () => {
      setDeleteError(null)
      const formData = new FormData()
      formData.set('id', String(search.id))
      startDeleteTransition(async () => {
         const result = await deleteSearch(null, formData)
         if (result?.needsConfirm) {
            setDeleteInfo(result)
            setDialogOpen(true)
         } else if (result?.error) {
            setDeleteError(result.error)
         }
      })
   }

   const handleConfirmDelete = () => {
      const formData = new FormData()
      formData.set('id', String(search.id))
      formData.set('confirmed', 'true')
      startDeleteTransition(async () => {
         const result = await deleteSearch(null, formData)
         if (result?.error) {
            setDeleteError(result.error)
         }
         setDialogOpen(false)
      })
   }

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
            <span className="inline-flex items-center gap-1.5">
               {search.url}
               <CopyUrlButton url={search.url} />
            </span>
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
               <button
                  onClick={() => setEditing(true)}
                  className="rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-muted"
               >
                  Edit
               </button>
               <button
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="rounded-md border border-destructive/30 px-2 py-0.5 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
               >
                  {deletePending && !dialogOpen ? '…' : 'Delete'}
               </button>
               {deleteError && (
                  <span className="text-xs text-destructive">{deleteError}</span>
               )}
               <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <AlertDialogContent size="sm">
                     <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{search.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete {deleteInfo?.runCount} run{deleteInfo?.runCount !== 1 ? 's' : ''},
                           {' '}{deleteInfo?.carCount} car{deleteInfo?.carCount !== 1 ? 's' : ''}
                           {deleteInfo?.screenshotCount > 0 && `, ${deleteInfo?.screenshotCount} screenshot${deleteInfo?.screenshotCount !== 1 ? 's' : ''}`}.
                           This action cannot be undone.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={deletePending} onClick={handleConfirmDelete}>
                           {deletePending ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </div>
         </td>
      </tr>
   )
}

function AddSearchForm() {
   const [state, submitAction, pending] = useActionState(createSearch, null)

   return (
      <form action={submitAction} className="flex flex-col gap-2">
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
                        <th className="p-2 text-center whitespace-nowrap">Actions</th>
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

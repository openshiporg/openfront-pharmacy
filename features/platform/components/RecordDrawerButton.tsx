'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'

import { CreateItemDrawerClientWrapper } from './CreateItemDrawerClientWrapper'
import { EditItemDrawerClientWrapper } from './EditItemDrawerClientWrapper'
import { RxButton } from './rx-ui'

/**
 * Opens the reference Keystone create or edit drawer for a list path (e.g. "products"), so the
 * form, field access and validation come from the list itself. Refreshes the page after saving.
 */
export function RecordDrawerButton({ listPath, itemId, label, variant }: { listPath: string; itemId?: string; label: ReactNode; variant?: 'default' | 'outline' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  return <>
    <RxButton type="button" variant={variant ?? (itemId ? 'outline' : 'default')} size="sm" onClick={() => setOpen(true)}>
      {itemId ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}{label}
    </RxButton>
    {open && (itemId
      ? <EditItemDrawerClientWrapper listKey={listPath} itemId={itemId} open={open} onClose={() => setOpen(false)} onSave={() => { setOpen(false); router.refresh() }} />
      : <CreateItemDrawerClientWrapper listKey={listPath} open={open} onClose={() => setOpen(false)} onCreate={() => { setOpen(false); router.refresh() }} />)}
  </>
}

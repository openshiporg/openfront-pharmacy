'use client'

import React, { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Fields } from '../../dashboard/components/Fields'
import { enhanceFields } from '../../dashboard/utils/enhanceFields'
import { useCreateItem } from '../../dashboard/utils/useCreateItem'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateItemDrawerClientProps {
  list: any
  onClose: () => void
  onCreate?: (newItem: any) => void
  /** Plain name for the thing being added, e.g. "staff member"; defaults to the list's name. */
  noun?: string
}

export function CreateItemDrawerClient({ 
  list, 
  onClose, 
  onCreate,
  noun,
}: CreateItemDrawerClientProps) {
  const name = noun || String(list.singular).toLowerCase()
  // Create enhanced fields exactly like dashboard implementation
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])

  // Use the working useCreateItem hook (same as dashboard)
  const createItem = useCreateItem(list, enhancedFields, { skipRevalidation: true })

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createItem) return

    try {
      // Use the createItem hook's create method (same as dashboard)
      const item = await createItem.create()
      if (item?.id) {
        toast.success(`${name.charAt(0).toUpperCase()}${name.slice(1)} added`)
        
        // Call onCreate callback if provided
        if (onCreate) {
          onCreate(item)
        }
        
        onClose()
      }
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Failed to create item')
    }
  }, [createItem, onCreate, onClose, name])

  // Don't render if no createItem hook available
  if (!createItem) {
    return (
      <>
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Error</DrawerTitle>
        </DrawerHeader>
        <div className="p-6 text-center">
          <p className="text-destructive">Unable to load create form</p>
        </div>
      </>
    )
  }

  return (
    <>
      <DrawerHeader className="flex-shrink-0">
        <DrawerTitle>Add {name}</DrawerTitle>
        <DrawerDescription className="sr-only">Add {name}</DrawerDescription>
      </DrawerHeader>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-4">
          <Fields
            {...createItem.props}
            fields={enhancedFields}
            view="createView"
          />
        </div>

        <DrawerFooter className="flex-shrink-0">
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={createItem.state === 'loading'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createItem.state === 'loading'}
              className="min-w-[120px]"
            >
              {createItem.state === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Add'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </form>
    </>
  )
}
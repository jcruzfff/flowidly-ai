'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { getUserClient } from '@/lib/supabase/auth-client'
import { ProposalUnified, ProposalSectionUnified, BlockElement, ElementType } from '@/types/database'
import ElementRenderer from '@/components/ElementRenderer'
import ElementMenu from '@/components/ElementMenu'
import AuditTrail from '@/components/AuditTrail'
import { HexColorPicker } from 'react-colorful'
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ClockIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

type Block = ProposalSectionUnified & {
  tempId?: string
  background_color?: string
}

export default function ProposalEditorPage() {
  const params = useParams()
  const proposalId = params.id as string

  const [, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [proposal, setProposal] = useState<ProposalUnified | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [title, setTitle] = useState('Untitled')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [copiedElementStyle, setCopiedElementStyle] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<{ blockId: string; elementId: string } | null>(null)
  const [dropTargetElement, setDropTargetElement] = useState<{ blockId: string; elementId: string } | null>(null)
  const [showBlockColorPicker, setShowBlockColorPicker] = useState<string | null>(null)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const fetchProposal = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch proposal')
      }
      const data = await response.json()
      setProposal(data.proposal)
      setTitle(data.proposal.title)
      
      if (data.proposal.proposal_sections && Array.isArray(data.proposal.proposal_sections)) {
        const sortedSections = data.proposal.proposal_sections.sort((a: Block, b: Block) => a.display_order - b.display_order)
        
               // If no sections exist, add a default empty block with one text element
               if (sortedSections.length === 0) {
                 const defaultBlock: Block = {
                   id: `temp-${Date.now()}`,
                   tempId: `temp-${Date.now()}`,
                   proposal_id: proposalId,
                   section_type: 'text',
                   title: null,
                   content: { 
                     background_color: '#FFFFFF',
                     elements: [{
                       id: `element-${Date.now()}`,
                       type: 'text',
                       content: { html: '<h1 style="text-align: center"></h1>' },
                       display_order: 0,
                     }]
                   },
                   display_order: 0,
                   is_visible: true,
                   created_at: new Date().toISOString(),
                   updated_at: new Date().toISOString(),
                   background_color: '#FFFFFF',
                 }
                 setBlocks([defaultBlock])
                 setHasUnsavedChanges(true)
               } else {
          // Extract background_color from content for UI
          const blocksWithBgColor = sortedSections.map((section: Block) => ({
            ...section,
            background_color: section.content?.background_color || '#FFFFFF',
          }))
          setBlocks(blocksWithBgColor)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  useEffect(() => {
    const init = async () => {
      const currentUser = await getUserClient()
      setUser(currentUser)
      await fetchProposal()
    }
    init()
  }, [fetchProposal])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleAddBlock = (afterIndex?: number) => {
    const newBlock: Block = {
      id: `temp-${Date.now()}`,
      tempId: `temp-${Date.now()}`,
      proposal_id: proposalId,
      section_type: 'text',
      title: null,
      content: { 
        background_color: '#FFFFFF',
        elements: [{
          id: `element-${Date.now()}`,
          type: 'text',
          content: { html: '<h1 style="text-align: center"></h1>' },
          display_order: 0,
        }]
      },
      display_order: afterIndex !== undefined ? afterIndex + 1 : blocks.length,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      background_color: '#FFFFFF',
    }

    const newBlocks = [...blocks]
    if (afterIndex !== undefined) {
      newBlocks.splice(afterIndex + 1, 0, newBlock)
      newBlocks.forEach((block, idx) => {
        block.display_order = idx
      })
    } else {
      newBlocks.push(newBlock)
    }

    setBlocks(newBlocks)
    setHasUnsavedChanges(true)
  }


  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex(b => b.id === blockId)
    if (currentIndex === -1) return

    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === blocks.length - 1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    const temp = newBlocks[currentIndex]
    newBlocks[currentIndex] = newBlocks[targetIndex]
    newBlocks[targetIndex] = temp

    newBlocks.forEach((block, idx) => {
      block.display_order = idx
    })

    setBlocks(newBlocks)
    setHasUnsavedChanges(true)
  }

  const handleDuplicateBlock = (blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) return

    const blockToDuplicate = blocks[blockIndex]
    const duplicatedBlock: Block = {
      ...blockToDuplicate,
      id: `temp-${Date.now()}`,
      tempId: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const newBlocks = [...blocks]
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock)
    
    newBlocks.forEach((block, idx) => {
      block.display_order = idx
    })

    setBlocks(newBlocks)
    setHasUnsavedChanges(true)
  }

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId)
    
    newBlocks.forEach((block, idx) => {
      block.display_order = idx
    })

    setBlocks(newBlocks)
    setHasUnsavedChanges(true)
  }

  const handleBlockColorChange = (blockId: string, color: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            background_color: color,
            content: {
              ...block.content,
              background_color: color,
            },
          }
        : block
    ))
    setHasUnsavedChanges(true)
  }

  // Element management functions
  const handleAddElement = (blockId: string, type: ElementType, afterIndex?: number, defaultStyle?: 'h1' | 'p') => {
    // Determine default HTML based on context
    let defaultHtml = '<h1 style="text-align: center"></h1>' // Default for new blocks or manual add
    if (defaultStyle === 'p') {
      // When created by pressing Enter, use paragraph
      defaultHtml = '<p></p>'
    }
    
    const newElement: BlockElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'button' 
        ? { buttonText: 'Click me', buttonUrl: '' } 
        : { html: defaultHtml },
      display_order: afterIndex !== undefined ? afterIndex + 1 : 0,
    }

    setBlocks(blocks.map(block => {
      if (block.id !== blockId) return block

      const elements = block.content.elements || []
      const newElements = [...elements]
      
      if (afterIndex !== undefined) {
        newElements.splice(afterIndex + 1, 0, newElement)
      } else {
        newElements.push(newElement)
      }

      // Reorder
      newElements.forEach((el, idx) => {
        el.display_order = idx
      })

      return {
        ...block,
        content: {
          ...block.content,
          elements: newElements,
        },
      }
    }))
    
    setHasUnsavedChanges(true)
  }

  const handleUpdateElement = (blockId: string, element: BlockElement) => {
    setBlocks(blocks.map(block => {
      if (block.id !== blockId) return block

      const elements = block.content.elements || []
      const updatedElements = elements.map((el: BlockElement) =>
        el.id === element.id ? element : el
      )

      return {
        ...block,
        content: {
          ...block.content,
          elements: updatedElements,
        },
      }
    }))
    
    setHasUnsavedChanges(true)
  }

  const handleDeleteElement = (blockId: string, elementId: string) => {
    setBlocks(blocks.map(block => {
      if (block.id !== blockId) return block

      const elements = block.content.elements || []
      const newElements = elements.filter((el: BlockElement) => el.id !== elementId)

      // Reorder
      newElements.forEach((el: BlockElement, idx: number) => {
        el.display_order = idx
      })

      return {
        ...block,
        content: {
          ...block.content,
          elements: newElements,
        },
      }
    }))
    
    setHasUnsavedChanges(true)
  }

  const handleElementDragStart = (blockId: string, elementId: string) => {
    console.log('🚀 handleElementDragStart:', blockId, elementId)
    setDraggedElement({ blockId, elementId })
  }

  const handleElementDragEnd = () => {
    console.log('🏁 handleElementDragEnd')
    setDraggedElement(null)
    setDropTargetElement(null)
  }

  const handleElementDragOver = (blockId: string, elementId: string) => {
    if (!draggedElement) return
    if (draggedElement.blockId === blockId && draggedElement.elementId === elementId) return
    
    console.log('📍 handleElementDragOver:', blockId, elementId)
    setDropTargetElement({ blockId, elementId })
  }

  const handleElementDrop = (targetBlockId: string, targetElementId: string) => {
    console.log('💧 handleElementDrop:', targetBlockId, targetElementId, 'draggedElement:', draggedElement)
    if (!draggedElement) return
    
    const { blockId: sourceBlockId, elementId: sourceElementId } = draggedElement

    setBlocks(blocks.map(block => {
      if (block.id !== sourceBlockId && block.id !== targetBlockId) return block

      // Same block reordering
      if (sourceBlockId === targetBlockId && block.id === sourceBlockId) {
        const elements = block.content.elements || []
        const sourceIndex = elements.findIndex((el: BlockElement) => el.id === sourceElementId)
        const targetIndex = elements.findIndex((el: BlockElement) => el.id === targetElementId)

        if (sourceIndex === -1 || targetIndex === -1) return block

        const newElements = [...elements]
        const [movedElement] = newElements.splice(sourceIndex, 1)
        newElements.splice(targetIndex, 0, movedElement)

        // Reorder
        newElements.forEach((el: BlockElement, idx: number) => {
          el.display_order = idx
        })

        return {
          ...block,
          content: {
            ...block.content,
            elements: newElements,
          },
        }
      }

      return block
    }))

    setHasUnsavedChanges(true)
    setDraggedElement(null)
    setDropTargetElement(null)
  }

  const handleCopyElementStyle = (blockId: string, elementId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return

    const element = block.content.elements?.find((el: BlockElement) => el.id === elementId)
    if (!element) return

    setCopiedElementStyle(JSON.stringify({
      type: element.type,
      buttonColor: element.content.buttonColor,
      // Add more style properties as needed
    }))
  }

  const handlePasteElementStyle = (blockId: string, elementId: string) => {
    if (!copiedElementStyle) return

    try {
      const style = JSON.parse(copiedElementStyle)
      
      setBlocks(blocks.map(block => {
        if (block.id !== blockId) return block

        const elements = block.content.elements || []
        const updatedElements = elements.map((el: BlockElement) => {
          if (el.id !== elementId) return el
          
          return {
            ...el,
            content: {
              ...el.content,
              buttonColor: style.buttonColor,
              // Apply more style properties as needed
            },
          }
        })

        return {
          ...block,
          content: {
            ...block.content,
            elements: updatedElements,
          },
        }
      }))

      setHasUnsavedChanges(true)
    } catch (err) {
      console.error('Failed to paste element style:', err)
    }
  }

  const handleCopyShareLink = async () => {
    // If no token exists, generate one first
    if (!proposal?.access_token) {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/regenerate-token`, {
          method: 'POST',
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate link')
    }
        
        const data = await response.json()
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}/p/${data.access_token}`
        
        await navigator.clipboard.writeText(shareUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        
        // Refresh proposal to get the new token
        fetchProposal()
      } catch (err) {
        console.error('Failed to generate link:', err)
        alert('Failed to generate shareable link')
      }
      return
    }

    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/p/${proposal.access_token}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      alert('Failed to copy link to clipboard')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      for (const block of blocks) {
        if (block.tempId) {
          await fetch(`/api/proposals/${proposalId}/sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section_type: block.section_type,
              title: block.title,
              content: block.content,
              display_order: block.display_order,
              is_visible: block.is_visible,
            }),
          })
        } else {
          await fetch(`/api/proposals/${proposalId}/sections/${block.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: block.content,
              display_order: block.display_order,
            }),
          })
        }
      }

      setHasUnsavedChanges(false)
      await fetchProposal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <p className="text-text-secondary">Loading page...</p>
      </div>
    )
  }

  if (error && !proposal) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <Link href="/proposals">
            <Button variant="primary" size="md">
              ← Back to Pages
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Top Navigation Bar */}
      <nav className="border-b border-border-default bg-bg-card sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Input
              value={title}
              onChange={handleTitleChange}
              className="text-lg font-semibold border-none bg-transparent focus:bg-bg-main transition-colors"
              placeholder="Untitled"
            />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="warning" size="sm">
              {proposal?.status?.toUpperCase() || 'DRAFT'}
            </Badge>
            {hasUnsavedChanges && (
              <span className="text-xs text-text-muted">Unsaved changes</span>
            )}
          </div>
        </div>

        <div className="px-6 py-3 flex items-center justify-between border-t border-border-default/50">
          <Link
            href="/proposals"
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            ← Back to Pages
          </Link>
          
          <div className="flex items-center gap-3">
            {proposal?.access_token && (
              <Button
                variant="ghost"
                size="md"
                onClick={handleCopyShareLink}
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                {linkCopied ? 'Copied!' : 'Copy Share Link'}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              {showAuditTrail ? 'Hide' : 'Show'} Audit Trail
            </Button>
          
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          </div>
        </div>
      </nav>

      {/* Canvas Area */}
      <div className="w-full">
        {blocks.length === 0 ? (
          /* Empty State */
          <div className="max-w-5xl mx-auto py-24 px-6">
            <div className="text-center">
              <button
                onClick={() => handleAddBlock()}
                className="group inline-flex flex-col items-center gap-4 p-12 rounded-xl hover:bg-bg-hover transition-all"
              >
                <div className="w-20 h-20 rounded-full bg-accent-light border-2 border-accent-primary/20 flex items-center justify-center group-hover:border-accent-primary group-hover:bg-accent-primary/10 transition-all">
                  <PlusIcon className="w-10 h-10 text-accent-primary" />
                </div>
                <p className="text-2xl text-text-muted group-hover:text-text-primary transition-colors font-medium">
                  Click to add your first block
                </p>
              </button>
            </div>
          </div>
        ) : (
          /* Blocks */
          <div>
            {blocks.map((block, index) => (
              <div key={block.id} className="relative">
                {/* Add Block Button (between blocks) - Absolute positioned to not affect layout */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAddBlock(index - 1)}
                    className="w-8 h-8 rounded-full bg-bg-card border border-border-default hover:border-accent-primary hover:bg-accent-light flex items-center justify-center transition-all shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4 text-text-secondary hover:text-accent-primary transition-colors" />
                  </button>
                </div>

                {/* Block */}
                <div className="group relative border-b border-border-default" style={{ backgroundColor: block.background_color || '#FFFFFF' }}>
                  {/* Top Left Toolbar - Absolutely positioned at 24px from top-left of block */}
                  <div className="absolute left-6 top-6 z-20">
                    <div className="flex items-center gap-1.5 bg-bg-card border border-border-default rounded-full p-2 shadow-lg">
                      <button
                        onClick={() => handleMoveBlock(block.id, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-bg-hover rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUpIcon className="w-5 h-5 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleMoveBlock(block.id, 'down')}
                        disabled={index === blocks.length - 1}
                        className="p-2 hover:bg-bg-hover rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDownIcon className="w-5 h-5 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDuplicateBlock(block.id)}
                        className="p-2 hover:bg-bg-hover rounded-full transition-colors"
                        title="Duplicate"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-2 hover:bg-error-bg rounded-full transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5 text-error" />
                      </button>
                      
                      {/* Color Picker */}
                      <div className="relative flex items-center border-l border-border-default pl-2.5 ml-1">
                        <button
                          onClick={() => setShowBlockColorPicker(showBlockColorPicker === block.id ? null : block.id)}
                          className="w-7 h-7 rounded-full border-2 border-border-default hover:border-accent-primary transition-colors shadow-sm"
                          style={{ backgroundColor: block.background_color || '#FFFFFF' }}
                          title="Change background color"
                        />

                        {/* Color Picker Dropdown */}
                        {showBlockColorPicker === block.id && (
                          <>
                            {/* Backdrop to close picker */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowBlockColorPicker(null)}
                            />
                            
                            {/* Color Picker Panel */}
                            <div className="absolute top-12 left-0 z-50 bg-bg-card border border-border-default rounded-2xl shadow-xl p-4">
                              <HexColorPicker 
                                color={block.background_color || '#FFFFFF'} 
                                onChange={(color) => handleBlockColorChange(block.id, color)}
                              />
                              
                              {/* Hex Input */}
                              <div className="mt-3 flex items-center gap-2">
                          <input
                                  type="text"
                            value={block.background_color || '#FFFFFF'}
                                  onChange={(e) => {
                                    const color = e.target.value
                                    if (/^#[0-9A-F]{6}$/i.test(color)) {
                                      handleBlockColorChange(block.id, color)
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 bg-bg-main border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                                  placeholder="#FFFFFF"
                          />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Block Content Area */}
                  <div className="w-full py-12 px-6">
                    {/* Content Container - Centered */}
                    <div className="max-w-3xl mx-auto relative">
                             {/* Elements within block */}
                             <div className="space-y-2">
                               {block.content.elements && block.content.elements.length > 0 ? (
                                 <>
                                   {block.content.elements
                                     .sort((a: BlockElement, b: BlockElement) => a.display_order - b.display_order)
                                     .map((element: BlockElement, elIndex: number) => {
                                       const isLastElement = elIndex === block.content.elements!.length - 1
                                       const isDragging = draggedElement?.blockId === block.id && draggedElement?.elementId === element.id
                                       const isDropTarget = dropTargetElement?.blockId === block.id && dropTargetElement?.elementId === element.id
                                       
                                       return (
                                         <div 
                                           key={element.id}
                                           onDrop={(e) => {
                                             e.preventDefault()
                                             e.stopPropagation()
                                             handleElementDrop(block.id, element.id)
                                           }}
                                         >
                                           {/* Element */}
                                           <div className="relative">
                                             <ElementRenderer
                                               element={element}
                                               onChangeAction={(updated) => handleUpdateElement(block.id, updated)}
                                               onDeleteAction={() => handleDeleteElement(block.id, element.id)}
                                               onDragStart={() => handleElementDragStart(block.id, element.id)}
                                               onDragEnd={handleElementDragEnd}
                                               onDragOver={() => handleElementDragOver(block.id, element.id)}
                                               isDragging={isDragging}
                                               isDropTarget={isDropTarget}
                                               onCopyStyle={() => handleCopyElementStyle(block.id, element.id)}
                                               onPasteStyle={() => handlePasteElementStyle(block.id, element.id)}
                                               hasCopiedStyle={!!copiedElementStyle}
                                             />
                                           </div>

                                           {/* Add element menu below - ONLY for last element */}
                                           {isLastElement && (
                                             <div className="group/element-add relative h-6 flex items-center opacity-0 hover:opacity-100 transition-opacity">
                                               <div className="max-w-3xl mx-auto w-full relative flex items-center gap-2">
                                                 <div className="flex-1 border-t border-border-default" />
                                                 <ElementMenu
                                                   onSelectTypeAction={(type) => handleAddElement(block.id, type, elIndex)}
                                                 />
                                                 <div className="flex-1 border-t border-border-default" />
                                               </div>
                                             </div>
                                           )}
                                         </div>
                                       )
                                     })}
                                 </>
                               ) : (
                          // Empty block - show add element menu
                          <div className="py-12 flex justify-center">
                            <ElementMenu
                              onSelectTypeAction={(type) => handleAddElement(block.id, type)}
                              trigger={
                                <div className="flex flex-col items-center gap-3 p-6 bg-bg-hover rounded-lg border-2 border-dashed border-border-default hover:border-accent-primary transition-all cursor-pointer">
                                  <PlusIcon className="w-8 h-8 text-text-muted" />
                                  <p className="text-sm text-text-muted">Click to add your first element</p>
                                </div>
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Block Button (at end) */}
            <div className="flex justify-center py-12">
              <button
                onClick={() => handleAddBlock()}
                className="w-12 h-12 rounded-full bg-bg-card border-2 border-dashed border-border-default hover:border-accent-primary hover:bg-accent-light flex items-center justify-center transition-all shadow-sm"
              >
                <PlusIcon className="w-6 h-6 text-text-secondary hover:text-accent-primary transition-colors" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Trail Sidebar */}
      {showAuditTrail && (
        <div className="fixed top-0 right-0 h-screen w-96 bg-bg-card border-l border-border-default shadow-xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-bg-card border-b border-border-default p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Audit Trail</h2>
            <button
              onClick={() => setShowAuditTrail(false)}
              className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <AuditTrail proposalId={proposalId} />
          </div>
        </div>
      )}
    </div>
  )
}

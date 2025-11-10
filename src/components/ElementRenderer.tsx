'use client'

import { BlockElement } from '@/types/database'
import RichTextEditor from './RichTextEditor'
import { useState, useRef, useEffect, Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { LinkIcon, PaintBrushIcon, TrashIcon, CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

type ElementRendererProps = {
  element: BlockElement
  onChangeAction: (element: BlockElement) => void
  onDeleteAction: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: () => void
  isDragging?: boolean
  isDropTarget?: boolean
  onCopyStyle?: () => void
  onPasteStyle?: () => void
  hasCopiedStyle?: boolean
}

export default function ElementRenderer({ 
  element, 
  onChangeAction, 
  onDeleteAction,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging = false,
  isDropTarget = false,
  onCopyStyle,
  onPasteStyle,
  hasCopiedStyle = false,
}: ElementRendererProps) {
  const [isEditingButton, setIsEditingButton] = useState(false)
  const [isEditingLink, setIsEditingLink] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState(element.content.buttonUrl || '')
  const [buttonColor, setButtonColor] = useState(element.content.buttonColor || '#4F46E5')
  const [isDraggingElement, setIsDraggingElement] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const handleDragResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    // Close button editor when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsEditingButton(false)
        setIsEditingLink(false)
      }
    }

    if (isEditingButton || isEditingLink) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditingButton, isEditingLink])

  useEffect(() => {
    const timeoutRef = handleDragResetTimeout.current
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef)
      }
      pointerStartRef.current = null
    }
  }, [])

  const handleContentChange = (content: string) => {
    onChangeAction({
      ...element,
      content: {
        ...element.content,
        html: content,
      },
    })
  }

  const handleButtonTextBlur = () => {
    if (textRef.current) {
      const newText = textRef.current.textContent || 'Name your button'
      onChangeAction({
        ...element,
        content: {
          ...element.content,
          buttonText: newText,
        },
      })
    }
  }

  const handleButtonLinkSave = () => {
    onChangeAction({
      ...element,
      content: {
        ...element.content,
        buttonUrl: linkInputValue,
      },
    })
    setIsEditingLink(false)
  }

  const handleButtonColorChange = (color: string) => {
    setButtonColor(color)
    onChangeAction({
      ...element,
      content: {
        ...element.content,
        buttonColor: color,
      },
    })
  }

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div className="w-full">
            <RichTextEditor
              content={element.content.html || ''}
              onChangeAction={handleContentChange}
            />
          </div>
        )

    case 'button':
      return (
        <div className="w-full flex justify-center py-4">
          <div
            ref={buttonRef}
            onMouseDown={(e) => {
              dragStartPos.current = { x: e.clientX, y: e.clientY }
              setIsDraggingElement(false)
            }}
            onMouseMove={(e) => {
              if (dragStartPos.current) {
                const dx = Math.abs(e.clientX - dragStartPos.current.x)
                const dy = Math.abs(e.clientY - dragStartPos.current.y)
                if (dx > 5 || dy > 5) {
                  setIsDraggingElement(true)
                }
              }
            }}
            onMouseUp={() => {
              if (!isDraggingElement && !isEditingButton) {
                setIsEditingButton(true)
              }
              dragStartPos.current = null
              setIsDraggingElement(false)
            }}
            onClick={(e) => {
              if (isDraggingElement) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
            className="relative inline-block"
          >
            {/* Toolbar - appears when editing (12px gap) */}
            {isEditingButton && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-bg-card border border-border-default rounded-lg p-1.5 shadow-xl">
                {/* Link button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditingLink(!isEditingLink)
                  }}
                  className={`p-2 rounded transition-colors ${
                    element.content.buttonUrl ? 'bg-accent-light text-accent-primary' : 'hover:bg-bg-hover text-text-secondary'
                  }`}
                  title="Add link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-border-default" />

                {/* Color picker */}
                <label className="p-2 hover:bg-bg-hover rounded transition-colors cursor-pointer" title="Button color">
                  <PaintBrushIcon className="w-4 h-4 text-text-secondary" />
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleButtonColorChange(e.target.value)
                    }}
                    className="sr-only"
                  />
                </label>

                <div className="w-px h-6 bg-border-default" />

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteAction()
                  }}
                  className="p-2 hover:bg-error-bg rounded transition-colors"
                  title="Delete button"
                >
                  <TrashIcon className="w-4 h-4 text-error" />
                </button>
              </div>
            )}

            {/* Link Input - appears when editing link */}
            {isEditingLink && (
              <div className="absolute -top-28 left-1/2 -translate-x-1/2 z-30 w-80 bg-bg-card border border-border-default rounded-lg p-3 shadow-xl">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-text-secondary">
                    Paste your link here
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={linkInputValue}
                      onChange={(e) => setLinkInputValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter') {
                          handleButtonLinkSave()
                        }
                      }}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 rounded-md bg-bg-main border border-border-default text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleButtonLinkSave()
                      }}
                      className="p-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-colors"
                      title="Save link"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* The Button itself - Qwilr style (bigger) */}
            <div
              className={`inline-flex items-center justify-center px-8 py-4 rounded-lg font-medium text-lg transition-all cursor-pointer ${
                isEditingButton ? 'ring-2 ring-accent-primary ring-offset-2' : 'hover:ring-2 hover:ring-accent-primary/50 hover:ring-offset-1'
              }`}
              style={{ backgroundColor: buttonColor }}
            >
              <span
                ref={textRef}
                contentEditable={isEditingButton}
                suppressContentEditableWarning
                onBlur={handleButtonTextBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    textRef.current?.blur()
                  }
                }}
                className="text-white outline-none"
              >
                {element.content.buttonText || 'Name your button'}
              </span>
            </div>

            {/* URL indicator */}
            {isEditingButton && !isEditingLink && element.content.buttonUrl && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-text-muted flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                <span className="truncate max-w-xs">{element.content.buttonUrl}</span>
              </div>
            )}
          </div>
        </div>
      )

    case 'divider':
      return (
        <div className="w-full py-6">
          <hr className="border-t-2 border-border-default" />
        </div>
      )

    case 'spacer':
      return (
        <div className="w-full py-8">
          {/* Empty spacer */}
        </div>
      )

    case 'image':
      return (
        <div className="w-full flex justify-center py-4">
          <div className="text-center p-8 border-2 border-dashed border-border-default rounded-lg">
            <p className="text-sm text-text-muted">Image upload coming soon</p>
          </div>
        </div>
      )

    case 'video':
      return (
        <div className="w-full flex justify-center py-4">
          <div className="text-center p-8 border-2 border-dashed border-border-default rounded-lg">
            <p className="text-sm text-text-muted">Video embed coming soon</p>
          </div>
        </div>
      )

      default:
        return null
    }
  }

  return (
    <div 
      className={`group/element relative w-full transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${
        isDropTarget ? 'border-t-2 border-accent-primary' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (onDragOver) onDragOver()
      }}
    >
      {/* Drop indicator */}
      {isDropTarget && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-accent-primary rounded-full" />
      )}

      {/* Drag handle - left side */}
      <div className="absolute -left-8 top-[6px]  z-10 opacity-0 group-hover/element:opacity-100 transition-opacity">
        <div
          draggable
          onDragStart={(e) => {
            console.log('🔵 Drag started from handle')
            console.log('🔵 Element ID:', element.id)
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'move'
            }
            if (onDragStart) {
              onDragStart()
            }
          }}
          onDragEnd={(e) => {
            console.log('🔵 Drag ended')
            if (onDragEnd) {
              onDragEnd()
            }
          }}
          className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors cursor-grab active:cursor-grabbing shadow-md border border-border-default"
          title="Drag to reorder"
        >
          <div className="grid grid-cols-2 gap-1">
            <div className="w-1 h-1 rounded-full bg-text-muted"></div>
            <div className="w-1 h-1 rounded-full bg-text-muted"></div>
            <div className="w-1 h-1 rounded-full bg-text-muted"></div>
            <div className="w-1 h-1 rounded-full bg-text-muted"></div>
            <div className="w-1 h-1 rounded-full bg-text-muted"></div>
            <div className="w-1 h-1 rounded-full bg-text-muted"></div>
          </div>
        </div>
      </div>

      {/* Menu trigger - right side */}
      <div className="absolute -right-8 top-[6px]  z-10 opacity-0 group-hover/element:opacity-100 transition-opacity">
        <Menu as="div" className="relative">
          <Menu.Button 
            className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors shadow-md border border-border-default"
            title="More options"
            onClick={() => {
              console.log('🔵 Menu button clicked')
            }}
          >
            <div className="flex flex-col gap-1 items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-text-muted"></div>
              <div className="w-1 h-1 rounded-full bg-text-muted"></div>
              <div className="w-1 h-1 rounded-full bg-text-muted"></div>
            </div>
          </Menu.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 top-10 w-52 bg-bg-card border border-border-default rounded-2xl shadow-xl py-2 focus:outline-none z-50 overflow-hidden">
              {onCopyStyle && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        console.log('🔵 Copy style clicked')
                        onCopyStyle()
                      }}
                      className={`${
                        active ? 'bg-bg-hover' : ''
                      } w-full px-4 py-3 text-left text-base text-text-primary flex items-center gap-3 transition-colors`}
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                      Copy Style
                    </button>
                  )}
                </Menu.Item>
              )}
              {onPasteStyle && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        console.log('🔵 Paste style clicked')
                        onPasteStyle()
                      }}
                      disabled={!hasCopiedStyle}
                      className={`${
                        active && hasCopiedStyle ? 'bg-bg-hover' : ''
                      } ${
                        !hasCopiedStyle ? 'opacity-50 cursor-not-allowed' : ''
                      } w-full px-4 py-3 text-left text-base text-text-primary flex items-center gap-3 transition-colors`}
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                      Paste Style
                    </button>
                  )}
                </Menu.Item>
              )}
              {(onCopyStyle || onPasteStyle) && <div className="border-t border-border-default my-1.5" />}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => {
                      console.log('🔵 Delete clicked')
                      onDeleteAction()
                    }}
                    className={`${
                      active ? 'bg-error-bg' : ''
                    } w-full px-4 py-3 text-left text-base text-error flex items-center gap-3 transition-colors`}
                  >
                    <TrashIcon className="w-5 h-5" />
                    Delete
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Element content */}
      {renderElementContent()}
    </div>
  )
}


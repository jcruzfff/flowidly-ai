'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { useEffect, useState, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  Bars3Icon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  LinkIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'

type RichTextEditorProps = {
  content: string
  onChange: (content: string) => void
  disabled?: boolean
  placeholder?: string
  editable?: boolean
  onFocus?: () => void
}

export default function RichTextEditor({
  content,
  onChange,
  disabled = false,
  placeholder = 'Start Typing',
  editable = true,
  onFocus,
}: RichTextEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isFirstFocus, setIsFirstFocus] = useState(true)
  const [textColor, setTextColor] = useState('#000000')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle.configure(),
      Color.configure(),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent-primary underline cursor-pointer',
        },
      }),
      Underline.configure(),
    ],
    content,
    editable: editable && !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Check if editor is truly empty (no text content)
      const text = editor.getText().trim()
      const isEmpty = !text || text === ''
      setShowPlaceholder(isEmpty)
      onChange(html)
    },
    onFocus: ({ editor }) => {
      // Don't hide placeholder on focus - let it disappear only when user types
      
      // On first focus, set to centered H1 mode
      if (isFirstFocus) {
        setIsFirstFocus(false)
        const text = editor.getText().trim()
        const isEmpty = !text || text === ''
        if (isEmpty) {
          editor.commands.setHeading({ level: 1 })
          editor.commands.setTextAlign('center')
        }
      }
      
      if (onFocus) {
        onFocus()
      }
    },
    onBlur: ({ editor }) => {
      const text = editor.getText().trim()
      const isEmpty = !text || text === ''
      setShowPlaceholder(isEmpty)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to

      if (hasSelection && editorRef.current) {
        const editorElement = editorRef.current.querySelector('.ProseMirror')
        if (editorElement) {
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            const editorRect = editorElement.getBoundingClientRect()

            setToolbarPosition({
              top: rect.top - editorRect.top - 60,
              left: rect.left - editorRect.left + (rect.width / 2) - 200,
            })
            setShowToolbar(true)
          }
        }
      } else {
        setShowToolbar(false)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[100px] text-text-primary',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
      const text = editor.getText().trim()
      const isEmpty = !text || text === ''
      setShowPlaceholder(isEmpty)
      setIsFirstFocus(isEmpty)
      
      // Auto-focus empty editor to show cursor
      if (isEmpty && editable && !disabled) {
        // Small delay to ensure editor is fully rendered
        setTimeout(() => {
          editor.commands.focus()
          // Don't override the existing format from the HTML content
        }, 100)
      }
    }
  }, [content, editor, editable, disabled])

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable && !disabled)
      // Debug: Log available extensions
      console.log('Editor extensions:', editor.extensionManager.extensions.map(e => e.name))
    }
  }, [disabled, editable, editor])

  // Close color picker when toolbar closes
  useEffect(() => {
    if (!showToolbar) {
      setShowColorPicker(false)
    }
  }, [showToolbar])

  if (!editor) {
    return null
  }

  const handlePlaceholderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (editor && !disabled) {
      editor.commands.focus()
      // Move cursor to end without triggering blur
      editor.commands.setTextSelection(editor.state.doc.content.size)
    }
  }

  return (
    <div className="w-full relative" ref={editorRef}>
      {/* Placeholder Overlay - Positioned where text will appear */}
      {showPlaceholder && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-0"
          style={{ top: '-24px', minHeight: '200px' }}
        >
          <h1
            className="text-text-muted font-bold cursor-text text-center"
            style={{ fontSize: '3rem', lineHeight: '1.1', margin: '0.5em 0', pointerEvents: 'none' }}
          >
            {placeholder}
          </h1>
        </div>
      )}

      {/* Floating Selection Toolbar */}
      {showToolbar && editor.state.selection.from !== editor.state.selection.to && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 flex items-stretch gap-1.5 bg-bg-card rounded-full px-3 py-2.5 shadow-xl border border-border-default"
          style={{
            top: `${toolbarPosition.top}px`,
          }}
        >
          {/* Heading H1 */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Heading 1"
          >
            H1
          </button>

          {/* Heading H2 */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Heading 2"
          >
            H2
          </button>

          {/* Normal Text */}
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
              editor.isActive('paragraph')
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Normal text"
          >
            <span className="text-base">A</span>
          </button>

          <div className="w-px h-auto bg-border-default mx-0.5" />

          {/* Bold */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-colors ${
              editor.isActive('bold')
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Bold"
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-4 py-2.5 rounded-full text-sm italic transition-colors ${
              editor.isActive('italic')
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Italic"
          >
            I
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-4 py-2.5 rounded-full text-sm line-through transition-colors ${
              editor.isActive('strike')
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Strikethrough"
          >
            S
          </button>

          <div className="w-px h-auto bg-border-default mx-0.5" />

          {/* Text Color Picker */}
          <div className="relative flex items-center">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-9 h-9 rounded-full border-2 border-border-default hover:border-accent-primary transition-colors shadow-sm flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: textColor }}
              title="Text color"
            >
              <span style={{ color: textColor === '#FFFFFF' || textColor === '#ffffff' ? '#000000' : '#FFFFFF' }}>A</span>
            </button>

            {/* Color Picker Dropdown */}
            {showColorPicker && (
              <>
                {/* Backdrop to close picker */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowColorPicker(false)}
                />
                
                {/* Color Picker Panel */}
                <div className="absolute top-[62px] left-1/2 -translate-x-1/2 z-50 bg-bg-card border border-border-default rounded-2xl shadow-xl p-4">
                  <HexColorPicker 
                    color={textColor} 
                    onChange={(color) => {
                      setTextColor(color)
                      if (editor && !editor.isDestroyed) {
                        try {
                          // Check if the command exists
                          if (editor.can().setColor(color)) {
                            editor.chain().focus().setColor(color).run()
                          } else {
                            console.warn('setColor command not available, available commands:', Object.keys(editor.commands))
                          }
                        } catch (error) {
                          console.error('Error setting color:', error)
                        }
                      }
                    }}
                  />
                  
                  {/* Hex Input */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => {
                        const color = e.target.value
                        if (/^#[0-9A-F]{6}$/i.test(color)) {
                          setTextColor(color)
                          if (editor && !editor.isDestroyed) {
                            try {
                              if (editor.can().setColor(color)) {
                                editor.chain().focus().setColor(color).run()
                              }
                            } catch (error) {
                              console.error('Error setting color:', error)
                            }
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-bg-main border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-auto bg-border-default mx-0.5" />

          {/* Align Left */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2.5 rounded-full transition-colors ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            title="Align left"
          >
            <Bars3BottomLeftIcon className="w-5 h-5" />
          </button>

          {/* Align Center */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2.5 rounded-full transition-colors ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            title="Align center"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Align Right */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2.5 rounded-full transition-colors ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            title="Align right"
          >
            <Bars3BottomRightIcon className="w-5 h-5" />
          </button>

          <div className="w-px h-auto bg-border-default mx-0.5" />

          {/* Bullet List */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2.5 rounded-full transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            title="Bullet list"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>

          {/* Numbered List */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-hover'
            }`}
            title="Numbered list"
          >
            1.
          </button>

          <div className="w-px h-auto bg-border-default mx-0.5" />

          {/* Link */}
          <button
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`p-2.5 rounded-full transition-colors ${
              editor.isActive('link')
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            title="Add link"
          >
            <LinkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Editor Content - No borders, seamless */}
      <div className="w-full relative z-10">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

type RichTextEditorProps = {
  content: string
  onChange: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function RichTextEditor({
  content,
  onChange,
  disabled = false,
  placeholder = 'Start typing...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration issues in Next.js
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-border-default rounded-md bg-bg-main overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border-default bg-bg-secondary px-2 py-1.5 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
          className={`px-2.5 py-1 rounded text-sm font-semibold transition-colors ${
            editor.isActive('bold')
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          B
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
          className={`px-2.5 py-1 rounded text-sm italic transition-colors ${
            editor.isActive('italic')
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          I
        </button>

        <div className="w-px h-6 bg-border-default mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
        >
          H3
        </button>

        <div className="w-px h-6 bg-border-default mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2.5 py-1 rounded text-sm transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
        >
          • List
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2.5 py-1 rounded text-sm transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
        >
          1. List
        </button>

        <div className="w-px h-6 bg-border-default mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2.5 py-1 rounded text-sm transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-accent-primary text-white'
              : 'bg-bg-main text-text-primary hover:bg-bg-card'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled}
        >
          " Quote
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2.5 py-1 rounded text-sm bg-bg-main text-text-primary hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          ―
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-bg-main text-text-primary">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}


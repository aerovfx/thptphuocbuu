'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Strikethrough,
  Highlighter,
  Minus,
  Plus,
  FileText,
  Eye,
  Save,
  Printer,
  MoreHorizontal,
  Type,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react'
import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react'

interface GoogleDocsEditorProps {
  content?: string
  title?: string
  onContentChange?: (content: string) => void
  onTitleChange?: (title: string) => void
  onSave?: () => void
  placeholder?: string
}

// Create base extensions array outside component to avoid recreating on each render
// This prevents duplicate extension warnings in React Strict Mode
// Note: Placeholder will be configured separately in useEditor
const baseExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    // Disable link and underline from StarterKit to avoid duplicates
    link: false,
    underline: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-600 underline cursor-pointer',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Color,
  TextStyle,
  Highlight.configure({
    multicolor: true,
  }),
  // Table extensions - only add if available
  ...(Table && TableRow && TableHeader && TableCell
    ? [
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ]
    : []),
]

// Internal component that actually uses the editor
function GoogleDocsEditorContent({
  content = '',
  title = '',
  onContentChange,
  onTitleChange,
  onSave,
  placeholder = 'Bắt đầu soạn thảo...',
}: GoogleDocsEditorProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const [zoom, setZoom] = useState(100)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)
  const formatMenuRef = useRef<HTMLDivElement>(null)

  const [fontSize, setFontSize] = useState('11')
  const [fontFamily, setFontFamily] = useState('Arial')
  const contentRef = useRef(content)
  const isUpdatingRef = useRef(false)
  const [editorReady, setEditorReady] = useState(false)
  const [canInitEditor, setCanInitEditor] = useState(false)

  // Memoize extensions to prevent recreating on each render
  // This is critical to avoid duplicate extension warnings
  // Add Placeholder extension with dynamic placeholder text
  const extensions = useMemo(
    () => [
      ...baseExtensions,
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder]
  )

  // Initialize editor - wrapper component ensures we're on client-side
  // immediatelyRender: false prevents SSR issues
  const editor = useEditor(
    {
      extensions,
      content, // Set content directly since we're already on client-side
      editable: true, // Ensure editor is editable
      onUpdate: ({ editor }) => {
        if (isUpdatingRef.current) return
        const html = editor.getHTML()
        contentRef.current = html
        onContentChange?.(html)
      },
      editorProps: {
        attributes: {
          class: 'ProseMirror',
          style: `font-family: ${fontFamily}; font-size: ${fontSize}pt;`,
        },
      },
      immediatelyRender: false, // Required to avoid SSR hydration mismatch
      autofocus: false, // We'll handle focus manually after editor is ready
      onCreate: ({ editor }) => {
        // Mark editor as ready when it's created
        setEditorReady(true)
      },
    },
    [fontFamily, fontSize, placeholder] // Dependencies - removed content to avoid re-initialization
  )

  // Initialize content when editor is first created
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentContent = editor.getHTML()
      // Only set content if editor is empty or content prop is different
      if (currentContent === '<p></p>' || (content && content !== currentContent)) {
        isUpdatingRef.current = true
        editor.commands.setContent(content || '', { emitUpdate: false })
        contentRef.current = content || ''
        setTimeout(() => {
          isUpdatingRef.current = false
          // Focus after setting content
          editor.commands.focus('end')
        }, 150)
      }
    }
  }, [editor]) // Only run when editor is created

  // Update editor content when prop changes externally (but not on initial mount)
  useEffect(() => {
    if (editor && !editor.isDestroyed && content && content !== contentRef.current) {
      const currentContent = editor.getHTML()
      // Only update if content actually changed
      if (content !== currentContent) {
        isUpdatingRef.current = true
        editor.commands.setContent(content, { emitUpdate: false })
        contentRef.current = content
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 100)
      }
    }
  }, [content, editor])

  // Ensure editor is always editable and can receive input
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // Ensure editor is editable immediately
      if (!editor.isEditable) {
        editor.setEditable(true)
      }
      
      // Continuously check and ensure editor is editable
      const ensureEditable = () => {
        if (editor && !editor.isDestroyed) {
          if (!editor.isEditable) {
            editor.setEditable(true)
          }
          
          // Also check DOM element
          if (editor.view && editor.view.dom) {
            const dom = editor.view.dom as HTMLElement
            if (dom && dom.contentEditable !== 'true') {
              dom.contentEditable = 'true'
            }
          }
        }
      }
      
      // Check immediately
      ensureEditable()
      
      // Also check periodically to ensure it stays editable
      const interval = setInterval(ensureEditable, 1000)
      
      return () => clearInterval(interval)
    }
  }, [editor])

  // Auto focus editor after it's ready
  useEffect(() => {
    if (editor && !editor.isDestroyed && editorReady) {
      // Wait for editor view to be ready (immediatelyRender: false means we need to wait)
      const checkAndFocus = () => {
        try {
          if (!editor.view || !editor.view.dom) {
            // Retry if editor view not ready
            setTimeout(checkAndFocus, 50)
            return
          }
          
          // Ensure editor is truly editable
          const dom = editor.view.dom as HTMLElement
          if (dom) {
            dom.contentEditable = 'true'
          }
          
          // Focus at end of document
          editor.commands.focus('end')
          
          // Double check focus after a short delay
          setTimeout(() => {
            if (editor && !editor.isDestroyed && editor.view) {
              try {
                editor.commands.focus('end')
              } catch (e) {
                // Ignore focus errors
              }
            }
          }, 100)
        } catch (error) {
          console.warn('Failed to focus editor:', error)
        }
      }
      
      // Start checking after a short delay
      const timer = setTimeout(checkAndFocus, 200)
      return () => clearTimeout(timer)
    }
  }, [editor, editorReady])

  // Update editor when title changes externally
  useEffect(() => {
    if (title !== localTitle) {
      setLocalTitle(title)
    }
  }, [title, localTitle])

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Nhập URL:', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false)
      }
    }

    if (showFormatDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFormatDropdown])

  // Don't render editor until it's ready
  if (!editor) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Top Menu Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Document Icon + Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FileText className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={24} />
            <input
              type="text"
              value={localTitle || 'Tài liệu không có tiêu đề'}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white font-medium text-sm min-w-0"
              placeholder="Tài liệu không có tiêu đề"
            />
          </div>

          {/* Right: Menu Items + Share + User */}
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins">
              Tệp
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins">
              Chỉnh sửa
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins">
              Xem
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins">
              Chèn
            </button>
            <div className="relative" ref={formatMenuRef}>
              <button
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins"
              >
                Định dạng
              </button>
              {showFormatDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[200px] py-1">
                  {/* Font Family */}
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Font chữ</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value)
                        if (editor) {
                          editor.view.dom.style.fontFamily = e.target.value
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-poppins"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Inter">Inter</option>
                      <option value="Source Sans 3">Source Sans 3</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Ubuntu">Ubuntu</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Cỡ chữ</label>
                    <select
                      value={fontSize}
                      onChange={(e) => {
                        setFontSize(e.target.value)
                        if (editor) {
                          editor.view.dom.style.fontSize = `${e.target.value}pt`
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-poppins"
                    >
                      {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72].map((size) => (
                        <option key={size} value={size}>
                          {size} pt
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Text Alignment */}
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Căn lề</label>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          if (editor) {
                            editor.chain().focus().setTextAlign('left').run()
                            setShowFormatDropdown(false)
                          }
                        }}
                        disabled={!editor}
                        className={`flex-1 px-2 py-1.5 text-sm rounded flex items-center justify-center space-x-1 ${
                          editor?.isActive({ textAlign: 'left' })
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Căn trái"
                      >
                        <AlignLeft size={16} />
                        <span>Trái</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editor) {
                            editor.chain().focus().setTextAlign('center').run()
                            setShowFormatDropdown(false)
                          }
                        }}
                        disabled={!editor}
                        className={`flex-1 px-2 py-1.5 text-sm rounded flex items-center justify-center space-x-1 ${
                          editor?.isActive({ textAlign: 'center' })
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Căn giữa"
                      >
                        <AlignCenter size={16} />
                        <span>Giữa</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editor) {
                            editor.chain().focus().setTextAlign('right').run()
                            setShowFormatDropdown(false)
                          }
                        }}
                        disabled={!editor}
                        className={`flex-1 px-2 py-1.5 text-sm rounded flex items-center justify-center space-x-1 ${
                          editor?.isActive({ textAlign: 'right' })
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Căn phải"
                      >
                        <AlignRight size={16} />
                        <span>Phải</span>
                      </button>
                    </div>
                  </div>

                  {/* Text Style */}
                  <div className="px-3 py-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Kiểu chữ</label>
                    <select
                      onChange={(e) => {
                        if (!editor) return
                        const value = e.target.value
                        if (value === 'paragraph') {
                          editor.chain().focus().setParagraph().run()
                        } else if (value.startsWith('heading')) {
                          const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3
                          editor.chain().focus().toggleHeading({ level }).run()
                        }
                        setShowFormatDropdown(false)
                      }}
                      disabled={!editor}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="paragraph">Văn bản thường</option>
                      <option value="heading1">Tiêu đề 1</option>
                      <option value="heading2">Tiêu đề 2</option>
                      <option value="heading3">Tiêu đề 3</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins">
              Công cụ
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-poppins">
              Trợ giúp
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={onSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center space-x-2 font-poppins"
            >
              <Save size={16} />
              <span>Lưu</span>
            </button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center space-x-1 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto">
          {/* Zoom */}
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Minus size={16} />
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="50">50%</option>
              <option value="75">75%</option>
              <option value="90">90%</option>
              <option value="100">100%</option>
              <option value="125">125%</option>
              <option value="150">150%</option>
            </select>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            title="Hoàn tác"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            title="Làm lại"
          >
            <Redo size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="In"
          >
            <Printer size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Text Style Dropdown */}
          <select
            onChange={(e) => {
              const value = e.target.value
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run()
              } else if (value.startsWith('heading')) {
                const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-poppins"
          >
            <option value="paragraph">Văn bản thường</option>
            <option value="heading1">Tiêu đề 1</option>
            <option value="heading2">Tiêu đề 2</option>
            <option value="heading3">Tiêu đề 3</option>
          </select>

          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value)
              if (editor) {
                editor.view.dom.style.fontFamily = e.target.value
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-poppins"
          >
            <option value="Arial">Arial</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Inter">Inter</option>
            <option value="Source Sans 3">Source Sans 3</option>
            <option value="Raleway">Raleway</option>
            <option value="Ubuntu">Ubuntu</option>
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value)
              if (editor) {
                editor.view.dom.style.fontSize = `${e.target.value}pt`
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-poppins"
          >
            {[8, 9, 10, 11, 12, 14, 18, 24, 36, 48, 72].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Format Buttons */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded ${
              editor.isActive('bold')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Đậm"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded ${
              editor.isActive('italic')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Nghiêng"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded ${
              editor.isActive('underline')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Gạch chân"
          >
            <UnderlineIcon size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded ${
              editor.isActive('strike')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Gạch ngang"
          >
            <Strikethrough size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Text Color */}
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            title="Màu chữ"
          />

          {/* Highlight */}
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded ${
              editor.isActive('highlight')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Đánh dấu"
          >
            <Highlighter size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Link */}
          <button
            onClick={setLink}
            className={`p-1.5 rounded ${
              editor.isActive('link')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Liên kết"
          >
            <LinkIcon size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Căn trái"
          >
            <AlignLeft size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Căn giữa"
          >
            <AlignCenter size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Căn phải"
          >
            <AlignRight size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded ${
              editor.isActive('bulletList')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Danh sách dấu đầu dòng"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded ${
              editor.isActive('orderedList')
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Danh sách đánh số"
          >
            <ListOrdered size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* More Options */}
          <button
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Tùy chọn khác"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Document Outline */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
                Các thẻ trong tài liệu
              </h3>
              <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Plus size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
              Các tiêu đề mà bạn thêm vào tài liệu sẽ xuất hiện ở đây.
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div
            style={{ zoom: `${zoom}%` }}
            className="min-h-full flex justify-center py-8"
          >
            <div className="w-full max-w-4xl">
              {editor ? (
                <div
                  onClick={(e) => {
                    // Ensure editor is focused and editable when clicking
                    if (editor && !editor.isDestroyed) {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      // Ensure editable
                      if (!editor.isEditable) {
                        editor.setEditable(true)
                      }
                      
                      // Focus editor
                      try {
                        editor.commands.focus()
                      } catch (error) {
                        console.warn('Focus error:', error)
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    // Also handle mousedown to ensure focus
                    if (editor && !editor.isDestroyed) {
                      if (!editor.isEditable) {
                        editor.setEditable(true)
                      }
                    }
                  }}
                >
                  <EditorContent 
                    editor={editor} 
                    suppressHydrationWarning
                  />
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">Đang khởi tạo editor...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Optional (can be added later) */}
      </div>
    </div>
  )
}

// Wrapper component to ensure editor only initializes on client-side
export default function GoogleDocsEditor(props: GoogleDocsEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  useLayoutEffect(() => {
    // Only set mounted on client-side after DOM is ready
    // Use requestAnimationFrame to ensure we're past any SSR phase
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        setIsMounted(true)
      })
    }
  }, [])

  // Don't render on server-side - return null immediately
  if (typeof window === 'undefined') {
    return null
  }

  // Show loading state until mounted
  if (!isMounted) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</div>
        </div>
      </div>
    )
  }

  // Only render editor content when fully mounted on client-side
  return <GoogleDocsEditorContent {...props} />
}


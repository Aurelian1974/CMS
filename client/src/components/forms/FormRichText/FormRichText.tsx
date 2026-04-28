import { useCallback, useEffect, useMemo } from 'react'
import { useController, type FieldValues } from 'react-hook-form'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import {
  Bold as IconBold,
  Italic as IconItalic,
  Underline as IconUnderline,
  Strikethrough,
  List,
  ListOrdered,
  Link as IconLink,
  Link2Off,
  Undo2,
  Redo2,
} from 'lucide-react'
import type { FormRichTextProps } from './FormRichText.types'
import styles from './FormRichText.module.scss'

const EMPTY_HTML_RE = /^\s*(<p>(\s|<br\s*\/?>)*<\/p>\s*)*$/i

const normalize = (html: string): string => (EMPTY_HTML_RE.test(html) ? '' : html)

interface ToolbarBtnProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

const ToolbarBtn = ({ onClick, active, disabled, title, children }: ToolbarBtnProps) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className={`${styles.tbBtn}${active ? ` ${styles.tbBtnActive}` : ''}`}
  >
    {children}
  </button>
)

interface ToolbarProps {
  editor: Editor
}

const Toolbar = ({ editor }: ToolbarProps) => {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL link:', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div className={styles.toolbar}>
      <ToolbarBtn
        title="Bold (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Italic (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Underline (Ctrl+U)"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <IconUnderline size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={15} />
      </ToolbarBtn>

      <span className={styles.tbSep} />

      <ToolbarBtn
        title="Listă cu marcatori"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Listă numerotată"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToolbarBtn>

      <span className={styles.tbSep} />

      <ToolbarBtn
        title="Inserează link"
        active={editor.isActive('link')}
        onClick={setLink}
      >
        <IconLink size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Elimină link"
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Link2Off size={15} />
      </ToolbarBtn>

      <span className={styles.tbSep} />

      <ToolbarBtn
        title="Undo (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Redo (Ctrl+Y)"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={15} />
      </ToolbarBtn>
    </div>
  )
}

export const FormRichText = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  disabled = false,
  className,
  height = 200,
}: FormRichTextProps<T>) => {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control })

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
        emptyEditorClass: styles.isEmpty,
      }),
    ],
    [placeholder],
  )

  const editor = useEditor({
    extensions,
    content: (value as string) ?? '',
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      onChange(normalize(e.getHTML()))
    },
    onBlur: () => {
      onBlur()
    },
  })

  // Sync external value -> editor (e.g. form reset, async load)
  useEffect(() => {
    if (!editor) return
    const incoming = (value as string) ?? ''
    const current = editor.getHTML()
    if (normalize(incoming) !== normalize(current)) {
      editor.commands.setContent(incoming || '<p></p>', { emitUpdate: false })
    }
  }, [value, editor])

  // Sync disabled state
  useEffect(() => {
    if (!editor) return
    if (editor.isEditable === disabled) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  const contentStyle = useMemo<React.CSSProperties>(
    () => ({ minHeight: typeof height === 'number' ? `${height}px` : height }),
    [height],
  )

  return (
    <div className={`${styles.formGroup}${className ? ` ${className}` : ''}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.rteWrap}${disabled ? ` ${styles.rteDisabled}` : ''}${error ? ` ${styles.rteError}` : ''}`}
      >
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} className={styles.editorContent} style={contentStyle} />
      </div>

      {error?.message && <span className={styles.error}>{error.message}</span>}
    </div>
  )
}

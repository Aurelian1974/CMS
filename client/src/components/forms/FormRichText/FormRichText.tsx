import { RichTextEditorComponent, Inject, Toolbar, Link, Image, HtmlEditor, Count, QuickToolbar, ToolbarType } from '@syncfusion/ej2-react-richtexteditor'
import { useController, type FieldValues } from 'react-hook-form'
import type { FormRichTextProps } from './FormRichText.types'
import styles from './FormRichText.module.scss'
import { useRef, useCallback } from 'react'

const TOOLBAR_ITEMS = [
  'Bold', 'Italic', 'Underline', 'StrikeThrough', '|',
  'OrderedList', 'UnorderedList', '|',
  'Indent', 'Outdent', '|',
  'CreateLink', '|',
  'Undo', 'Redo',
]

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
    field: { value, onChange },
    fieldState: { error },
  } = useController({ name, control })

  const rteRef = useRef<RichTextEditorComponent | null>(null)

  const handleChange = useCallback(() => {
    if (rteRef.current) {
      onChange(rteRef.current.value ?? '')
    }
  }, [onChange])

  return (
    <div className={`${styles.formGroup}${className ? ` ${className}` : ''}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.rteWrap}${disabled ? ` ${styles.rteDisabled}` : ''}${error ? ` ${styles.rteError}` : ''}`}>
        <RichTextEditorComponent
          ref={rteRef}
          value={value ?? ''}
          change={handleChange}
          placeholder={placeholder}
          enabled={!disabled}
          showCharCount={false}
          enableResize={false}
          height={height}
          cssClass="form-rte"
          toolbarSettings={{ items: TOOLBAR_ITEMS, enableFloating: false, type: ToolbarType.Expand }}
        >
          <Inject services={[Toolbar, Link, Image, HtmlEditor, Count, QuickToolbar]} />
        </RichTextEditorComponent>
      </div>

      {error?.message && <span className={styles.error}>{error.message}</span>}
    </div>
  )
}

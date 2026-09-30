import { useState } from 'react'
import type { ReactNode } from 'react'

export type PaperField = {
  label: string
  value?: string | number
  unit?: string
  wide?: boolean
  multiline?: boolean
  type?: 'date'
}

type PaperSectionProps = {
  number: string
  title: string
  className: string
  children: ReactNode
  editable?: boolean
}

export function PaperSection({ number, title, className, children, editable = false }: PaperSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <fieldset
      className={`paper-section ${className}${collapsed ? ' collapsed' : ''}${editable ? '' : ' paper-readonly'}`}
      disabled={!editable}
    >
      <legend>
        <span>
          <b>{number}.</b> {title}
        </span>
        <span className="paper-section-actions">
          <button
            type="button"
            className="collapse-section"
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? 'Expandir' : 'Minimizar'} ${title}`}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? '＋' : '−'}
          </button>
        </span>
      </legend>
      {!collapsed && children}
    </fieldset>
  )
}

export function PaperFields({ fields, variant }: { fields: PaperField[]; variant?: 'single' | 'single compact' }) {
  return (
    <div className={variant ? `paper-fields ${variant}` : 'paper-fields'}>
      {fields.map((field) => (
        <label key={field.label} className={field.wide ? 'wide' : undefined}>
          {field.label}
          {field.multiline ? (
            <textarea defaultValue={field.value} />
          ) : (
            <input type={field.type} defaultValue={field.value} />
          )}
          {field.unit && ` ${field.unit}`}
        </label>
      ))}
    </div>
  )
}

export function PaperTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: { key: string | number; values: string[] }[]
}) {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.values.map((value, index) => (
              <td key={index}>
                <input aria-label={`Campo ${index + 1}`} defaultValue={value} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

import React, { useMemo } from 'react'

interface StatusBarProps {
  fileName: string
  content: string
  isDirty: boolean
}

export default function StatusBar({ fileName, content, isDirty }: StatusBarProps) {
  const stats = useMemo(() => {
    const chars = content.length
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length
    const lines = content.split('\n').length
    return { chars, words, lines }
  }, [content])

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <span className="status-bar__item status-bar__path" title={fileName}>
          {isDirty && <span className="status-bar__dot">●</span>}
          {fileName}
        </span>
      </div>

      <div className="status-bar__right">
        <span className="status-bar__item">
          <span className="status-bar__label">Lines</span>
          <span className="status-bar__value">{stats.lines.toLocaleString()}</span>
        </span>
        <span className="status-bar__sep" />
        <span className="status-bar__item">
          <span className="status-bar__label">Words</span>
          <span className="status-bar__value">{stats.words.toLocaleString()}</span>
        </span>
        <span className="status-bar__sep" />
        <span className="status-bar__item status-bar__item--chars">
          <span className="status-bar__label">Chars</span>
          <span className="status-bar__value">{stats.chars.toLocaleString()}</span>
        </span>

        <span className="status-bar__sep" />
        <span className="status-bar__item">
          <span className="status-bar__lang">Markdown</span>
        </span>
      </div>
    </div>
  )
}

import React from 'react'
import MonacoEditor from '@monaco-editor/react'

interface EditorProps {
  value: string
  onChange: (val: string) => void
  theme: 'dark' | 'light'
  onMount?: (editor: any) => void
}

export default function Editor({ value, onChange, theme, onMount }: EditorProps) {
  return (
    <div className="editor-wrapper">
      <MonacoEditor
        height="100%"
        language="markdown"
        loading={<div className="editor-loading">Loading editor...</div>}
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onChange={(val) => onChange(val ?? '')}
        onMount={onMount}
        options={{
          fontSize: 14,
          fontFamily: '"JetBrains Mono", "Fira Code", Menlo, monospace',
          fontLigatures: true,
          lineHeight: 22,
          wordWrap: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderWhitespace: 'none',
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            useShadows: false,
          },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          suggest: { showWords: false },
          quickSuggestions: false,
        }}
      />
    </div>
  )
}

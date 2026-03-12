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
    <div className="flex-1 min-h-0 min-w-0 bg-white dark:bg-[#16181d] overflow-hidden rounded-bl-xl group">
      <MonacoEditor
        height="100%"
        language="markdown"
        loading={<div className="flex items-center justify-center h-full text-text-muted text-[13px] bg-bg-pane">Loading editor...</div>}
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

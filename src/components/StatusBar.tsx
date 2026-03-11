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
    <div className="flex items-center justify-between h-[30px] px-[14px] bg-gray-50 dark:bg-[#16181d] border-t border-gray-200 dark:border-[#2d3139] shrink-0 text-[11.5px] text-gray-500 dark:text-gray-400 [app-region:drag]">
      <div className="flex items-center gap-[10px] [app-region:no-drag]">
        <span className="flex items-center gap-[5px] max-w-[480px] overflow-hidden whitespace-nowrap text-ellipsis font-mono text-[11px]" title={fileName}>
          {isDirty && <span className="text-amber-500 text-[10px] leading-none">●</span>}
          {fileName}
        </span>
      </div>

      <div className="flex items-center gap-[10px] [app-region:no-drag]">
        <span className="flex items-center gap-[4px]">
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">Lines</span>
          <span className="text-gray-600 dark:text-gray-300 tabular-nums">{stats.lines.toLocaleString()}</span>
        </span>
        <span className="w-[1px] h-[12px] bg-gray-300 dark:bg-[#3f4451]" />
        <span className="flex items-center gap-[4px]">
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">Words</span>
          <span className="text-gray-600 dark:text-gray-300 tabular-nums">{stats.words.toLocaleString()}</span>
        </span>
        <span className="w-[1px] h-[12px] bg-gray-300 dark:bg-[#3f4451]" />
        <span className="flex items-center gap-[4px]">
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">Chars</span>
          <span className="text-gray-600 dark:text-gray-300 tabular-nums">{stats.chars.toLocaleString()}</span>
        </span>

        <span className="w-[1px] h-[12px] bg-gray-300 dark:bg-[#3f4451]" />
        <span className="flex items-center gap-[4px]">
          <span className="text-blue-600 dark:text-blue-500 font-semibold text-[11px]">Markdown</span>
        </span>
      </div>
    </div>
  )
}

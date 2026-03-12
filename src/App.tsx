import { useState, useEffect, useCallback, useRef } from 'react'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import StatusBar from './components/StatusBar'

import './styles/global.css'

const DEFAULT_CONTENT = ``;

type Theme = 'dark' | 'light'

export type PDFFormat = 'letter' | 'a4' | 'legal'
export type PDFOrientation = 'portrait' | 'landscape'

export interface PDFConfig {
  format: PDFFormat
  orientation: PDFOrientation
  margin: number
  headerText: string
  footerText: string
}

export default function App() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [fileName, setFileName] = useState('Untitled.md')
  const [isDirty, setIsDirty] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')
  const [splitPos, setSplitPos] = useState(50)
  const [showPDFTimestamp, setShowPDFTimestamp] = useState(true)
  const [showPageNumbers, setShowPageNumbers] = useState(true)
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    format: 'a4',
    orientation: 'portrait',
    margin: 0.5,
    headerText: '',
    footerText: ''
  })
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null)

  // Apply theme on root element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Detect mobile for initial splitPos or pane handling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return
    setContent('')
    setFileName('Untitled.md')
    setIsDirty(false)
  }, [isDirty])

  const handleOpenClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setContent(text)
        setFileName(file.name)
        setIsDirty(false)
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`
    a.click()
    URL.revokeObjectURL(url)
    setIsDirty(false)
  }, [content, fileName])

  const handleInsertPageBreak = useCallback(() => {
    const pbTag = '\n<div class="page-break"></div>\n'
    if (editorRef.current) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      const range = {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn
      }
      editor.executeEdits('insert-page-break', [
        { range, text: pbTag, forceMoveMarkers: true }
      ])
    } else {
      setContent(prev => prev + pbTag)
    }
    setIsDirty(true)
  }, [])

  const handleDownloadPDF = useCallback(() => {
    // Wait for any state changes (like forced light mode) to flush to DOM
    setTimeout(() => {
      window.print()
    }, 100)
  }, [])

  const handleInsertImageClick = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleImageSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') {
        const imgMarkdown = `![${file.name}](${dataUrl})`

        if (editorRef.current) {
          const editor = editorRef.current
          const selection = editor.getSelection()
          const range = {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn
          }
          editor.executeEdits('insert-image', [
            { range, text: imgMarkdown, forceMoveMarkers: true }
          ])
        } else {
          setContent(prev => prev + '\n' + imgMarkdown + '\n')
        }
        setIsDirty(true)
      }
    }
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [])


  const handleChange = useCallback((value: string) => {
    setContent(value)
    setIsDirty(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  // Splitter drag logic 
  const onMouseDown = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPos(Math.min(Math.max(pct, 20), 80))
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-gray-100 font-ui font-antialiased print:h-auto print:overflow-visible print:bg-white">
      <style>{`
        @page {
          size: ${pdfConfig.format} ${pdfConfig.orientation};
          margin: 0 !important;
        }
        @media print {
          body {
            margin: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .preview-page-container {
            gap: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .preview-content {
            box-shadow: none !important;
            border: none !important;
            break-inside: avoid;
            page-break-after: always;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Main Web UI: Adapted for print by hiding sidebars directly instead of a separate portal */}
      <div className="flex flex-col h-full overflow-hidden text-gray-900 dark:text-gray-100 print:overflow-visible print:h-auto print:block">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".md,.markdown,.txt"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={imageInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleImageSelected}
        />

        <div className="print:hidden">
          <Toolbar
            theme={theme}
            isDirty={isDirty}
            fileName={fileName}
            onNew={handleNew}
            onOpen={handleOpenClick}
            onDownload={handleDownload}
            onDownloadPDF={handleDownloadPDF}
            onInsertImage={handleInsertImageClick}
            onInsertPageBreak={handleInsertPageBreak}
            onToggleTheme={toggleTheme}
            showPDFTimestamp={showPDFTimestamp}
            onTogglePDFTimestamp={() => setShowPDFTimestamp(!showPDFTimestamp)}
            showPageNumbers={showPageNumbers}
            onTogglePageNumbers={() => setShowPageNumbers(!showPageNumbers)}
            pdfConfig={pdfConfig}
            onUpdatePDFConfig={(updates) => setPdfConfig(prev => ({ ...prev, ...updates }))}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        <div
          ref={containerRef}
          className="flex flex-1 overflow-hidden relative print:overflow-visible print:block print:h-auto print:w-full"
        >
          <div
            className="print:hidden flex flex-col h-full bg-white dark:bg-[#16181d] shadow-sm relative z-[1] transition-transform duration-300 md:transition-none md:translate-x-0 absolute md:relative w-full md:w-auto"
            style={{ width: isMobile ? '100%' : `${splitPos}%`, transform: isMobile && activeTab !== 'editor' ? 'translateX(-100%)' : 'none' }}
          >
            <Editor
              value={content}
              onChange={handleChange}
              theme={theme}
              onMount={(editor) => { editorRef.current = editor }}
            />
          </div>

          {/* Splitter */}
          <div
            className="print:hidden hidden md:flex w-[6px] bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize shrink-0 relative z-[10] transition-colors items-center justify-center group active:bg-blue-600"
            onMouseDown={onMouseDown}
          >
            <div className="w-[2px] h-[24px] bg-gray-400 dark:bg-gray-600 rounded-full group-hover:bg-white transition-colors" />
          </div>

          <div
            className="flex flex-col h-full bg-gray-50 dark:bg-[#0f1115] relative z-[0] transition-transform duration-300 md:transition-none md:translate-x-0 absolute md:relative w-full md:w-auto print:!absolute print:!inset-0 print:!w-full print:!h-auto print:!block print:!transform-none print:z-50 print:bg-white"
            style={{ width: isMobile ? '100%' : `${100 - splitPos}%`, transform: isMobile && activeTab !== 'preview' ? 'translateX(100%)' : 'none' }}
          >
            <Preview
              content={content}
              pdfConfig={pdfConfig}
              showPDFTimestamp={showPDFTimestamp}
              showPageNumbers={showPageNumbers}
            />
          </div>
        </div>

        <div className="print:hidden">
          <StatusBar
            content={content}
            fileName={fileName}
            isDirty={isDirty}
          />
        </div>
      </div>
    </div>
  )
}

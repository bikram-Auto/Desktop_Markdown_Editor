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
    document.documentElement.setAttribute('data-theme', theme)
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

  const handleDownloadPDF = useCallback(async () => {
    const container = document.querySelector('.preview-page-container') as HTMLElement
    if (!container) return

    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = html2pdfModule.default

    // Temporarily switch to light theme and add export class to body for PDF capture
    const currentTheme = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', 'light')
    document.body.classList.add('pdf-export-mode')

    // Wait for repaint
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    const opt = {
      margin: pdfConfig.margin,
      filename: fileName.replace(/\.[^/.]+$/, "") + '.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'in',
        format: pdfConfig.format,
        orientation: pdfConfig.orientation
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    const worker = html2pdf().set(opt).from(container).toPdf()

    await worker.get('pdf').then((pdf: any) => {
      const totalPages = pdf.internal.getNumberOfPages()

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(100)

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const horizontalMargin = pdfConfig.margin
        const verticalOffset = pdfConfig.margin * 0.6 // Place text at 60% of the margin area

        // Header (Top Left): Date/Time (Conditional)
        if (showPDFTimestamp) {
          const now = new Date()
          const dateString = now.toLocaleDateString('en-GB') + ', ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          pdf.text(dateString, horizontalMargin, verticalOffset)
        }

        // Header (Top Right): Custom Header Text
        if (pdfConfig.headerText) {
          pdf.text(pdfConfig.headerText, pageWidth - horizontalMargin, verticalOffset, { align: 'right' })
        }

        // Footer (Bottom Left): Custom Footer Text
        if (pdfConfig.footerText) {
          pdf.text(pdfConfig.footerText, horizontalMargin, pageHeight - verticalOffset)
        }

        // Footer (Bottom Right): Page Count
        pdf.text(`${i}/${totalPages}`, pageWidth - horizontalMargin, pageHeight - verticalOffset, { align: 'right' })
      }
    })

    await worker.save()

    // Cleanup
    document.body.classList.remove('pdf-export-mode')
    document.documentElement.setAttribute('data-theme', currentTheme || 'dark')
  }, [fileName, showPDFTimestamp, pdfConfig])

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

  const handleRename = useCallback((newName: string) => {
    setFileName(newName)
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
    <div className="app">
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
        onRename={handleRename}
        showPDFTimestamp={showPDFTimestamp}
        onTogglePDFTimestamp={() => setShowPDFTimestamp(!showPDFTimestamp)}
        pdfConfig={pdfConfig}
        onUpdatePDFConfig={(config: Partial<PDFConfig>) => setPdfConfig(prev => ({ ...prev, ...config }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={`workspace ${isMobile ? 'workspace--mobile' : ''}`} ref={containerRef}>
        {(!isMobile || activeTab === 'editor') && (
          <div className="pane pane--editor" style={{ width: isMobile ? '100%' : `${splitPos}%` }}>
            <div className="pane__header">
              <span className="pane__label">Editor</span>
            </div>
            <Editor
              value={content}
              onChange={handleChange}
              theme={theme}
              onMount={(editor) => { editorRef.current = editor }}
            />
          </div>
        )}

        {!isMobile && (
          <div className="splitter" onMouseDown={onMouseDown}>
            <div className="splitter__handle" />
          </div>
        )}

        {(!isMobile || activeTab === 'preview') && (
          <div className="pane pane--preview" style={{ width: isMobile ? '100%' : `${100 - splitPos}%` }}>
            <div className="pane__header">
              <span className="pane__label">Preview</span>
            </div>
            <Preview content={content} pdfConfig={pdfConfig} />
          </div>
        )}
      </div>

      <StatusBar fileName={fileName} content={content} isDirty={isDirty} />
    </div>
  )
}


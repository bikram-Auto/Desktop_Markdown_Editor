import { useState, useEffect, useCallback, useRef } from 'react'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import StatusBar from './components/StatusBar'
import { compressImage, storeImage, deleteImage, getAllHashes } from './utils/imageStorage'

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
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false)
  
  // Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [tempFileName, setTempFileName] = useState('')
  const [pendingAction, setPendingAction] = useState<'md' | 'pdf' | null>(null)
  
  // Banner State
  const [headerBanner, setHeaderBanner] = useState('')
  const [footerBanner, setFooterBanner] = useState('')

  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const headerBannerInputRef = useRef<HTMLInputElement>(null)
  const footerBannerInputRef = useRef<HTMLInputElement>(null)
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

  const finalizeMDDownload = useCallback((name: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Ensure .md extension
    const finalName = name.toLowerCase().endsWith('.md') ? name : `${name}.md`
    a.download = finalName
    a.click()
    URL.revokeObjectURL(url)
    setIsDirty(false)
    setFileName(finalName)
  }, [content])

  const handleDownload = useCallback(() => {
    setTempFileName(fileName.replace(/\.md$/i, ''))
    setPendingAction('md')
    setIsRenameModalOpen(true)
  }, [fileName])

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

  const finalizePDFDownload = useCallback((name: string) => {
    // PDF orientation and format are handled by @page CSS
    // Browser usually uses document.title as the filename
    const originalTitle = document.title
    document.title = name
    setFileName(name.toLowerCase().endsWith('.md') ? name : `${name}.md`)
    
    setTimeout(() => {
      window.print()
      // Restore title after print dialog closes (though print is often blocking)
      setTimeout(() => { document.title = originalTitle }, 1000)
    }, 100)
  }, [])

  const handleDownloadPDF = useCallback(() => {
    setTempFileName(fileName.replace(/\.md$/i, ''))
    setPendingAction('pdf')
    setIsRenameModalOpen(true)
  }, [fileName])

  const handleInsertImageClick = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleImageSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // New pipeline: Compress -> Hash -> Store in IndexedDB
      const compressedBlob = await compressImage(file);
      const hash = await storeImage(compressedBlob);
      const imgMarkdown = `![${file.name}](${hash})`;

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
    } catch (err) {
      console.error('Image processing failed:', err);
    }
    
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [])

  const handleHeaderBannerSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') setHeaderBanner(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleFooterBannerSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') setFooterBanner(text)
    }
    reader.readAsText(file)
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

  // Image Cleanup Logic
  const cleanupImages = useCallback(async () => {
    try {
      // Find all hashes in current content
      const hashRegex = /!\[.*?\]\s*\(([a-f0-9]{64})\)/g;
      const matches = [...content.matchAll(hashRegex)];
      const activeHashes = new Set(matches.map(m => m[1]));

      // Get all hashes from DB
      const allHashes = await getAllHashes();

      // Delete unused ones
      for (const hash of allHashes) {
        if (!activeHashes.has(hash)) {
          await deleteImage(hash);
        }
      }
    } catch (err) {
      console.error('Image cleanup failed:', err);
    }
  }, [content]);

  // Run cleanup when content is stable (not dirty) or periodically
  useEffect(() => {
    // Only cleanup when not editing/dirty to avoid race conditions or performance issues
    if (!isDirty && content) {
      cleanupImages();
    }
  }, [isDirty]); // Trigger on "save" or stabilization

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
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Force light mode colors during print even if app is in dark mode */
          .dark {
            background: white !important;
            color: black !important;
          }

          .preview-page-container {
            gap: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          .preview-content {
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            break-inside: avoid;
            page-break-after: always;
            page-break-inside: avoid;
          }

          /* Reset prose-invert variables to light mode values during print */
          .dark .prose {
            --tw-prose-body: #374151 !important;
            --tw-prose-headings: #111827 !important;
            --tw-prose-lead: #4b5563 !important;
            --tw-prose-links: #2563eb !important;
            --tw-prose-bold: #111827 !important;
            --tw-prose-counters: #6b7280 !important;
            --tw-prose-bullets: #d1d5db !important;
            --tw-prose-hr: #e5e7eb !important;
            --tw-prose-quotes: #111827 !important;
            --tw-prose-quote-borders: #e5e7eb !important;
            --tw-prose-captions: #6b7280 !important;
            --tw-prose-code: #111827 !important;
            --tw-prose-pre-code: #374151 !important;
            --tw-prose-pre-bg: #f9fafb !important;
            --tw-prose-th-borders: #d1d5db !important;
            --tw-prose-td-borders: #e5e7eb !important;
          }

          /* Increase contrast for header/footer text in print */
          .text-gray-400 {
            color: #4b5563 !important;
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
        <input
          type="file"
          ref={headerBannerInputRef}
          style={{ display: 'none' }}
          accept=".html,.htm"
          onChange={handleHeaderBannerSelected}
        />
        <input
          type="file"
          ref={footerBannerInputRef}
          style={{ display: 'none' }}
          accept=".html,.htm"
          onChange={handleFooterBannerSelected}
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
            isEditorCollapsed={isEditorCollapsed}
            onToggleEditor={() => setIsEditorCollapsed(!isEditorCollapsed)}
            onUploadHeaderBanner={() => headerBannerInputRef.current?.click()}
            onClearHeaderBanner={() => setHeaderBanner('')}
            hasHeaderBanner={!!headerBanner}
            onUploadFooterBanner={() => footerBannerInputRef.current?.click()}
            onClearFooterBanner={() => setFooterBanner('')}
            hasFooterBanner={!!footerBanner}
          />
        </div>
        <div
          ref={containerRef}
          className="flex flex-1 overflow-hidden relative print:overflow-visible print:block print:h-auto print:w-full"
        >
          <div
            className={`print:hidden flex flex-col h-full bg-white dark:bg-[#16181d] shadow-sm relative z-[1] transition-transform duration-300 md:transition-none md:translate-x-0 absolute md:relative w-full md:w-auto ${isEditorCollapsed ? 'md:hidden' : ''}`}
            style={{ 
              width: isMobile ? '100%' : `${splitPos}%`, 
              transform: isMobile ? (activeTab === 'editor' ? 'translateX(0)' : 'translateX(-100%)') : 'none',
              position: isMobile ? 'absolute' : 'relative',
              left: 0,
              top: 0
            }}
          >
            <Editor
              value={content}
              onChange={handleChange}
              theme={theme}
              onMount={(editor) => { 
                editorRef.current = editor 
                
                // Add paste listener for images
                const container = editor.getDomNode();
                if (container) {
                  container.addEventListener('paste', async (e: ClipboardEvent) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    
                    for (const item of items) {
                      if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                          e.preventDefault();
                          try {
                            const compressed = await compressImage(file);
                            const hash = await storeImage(compressed);
                            const markdown = `![pasted-image](${hash})`;
                            
                            const selection = editor.getSelection();
                            editor.executeEdits('paste-image', [{
                              range: selection,
                              text: markdown,
                              forceMoveMarkers: true
                            }]);
                            setIsDirty(true);
                          } catch (err) {
                            console.error('Paste image failed:', err);
                          }
                        }
                      }
                    }
                  }, true);
                }
              }}
            />
          </div>

          {/* Splitter */}
          <div
            className={`print:hidden hidden md:flex w-[6px] bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize shrink-0 relative z-[10] transition-colors items-center justify-center group active:bg-blue-600 ${isEditorCollapsed ? '!hidden' : ''}`}
            onMouseDown={onMouseDown}
          >
            <div className="w-[2px] h-[24px] bg-gray-400 dark:bg-gray-600 rounded-full group-hover:bg-white transition-colors" />
          </div>

          <div
            className="flex flex-col h-full bg-gray-50 dark:bg-[#0f1115] relative z-[0] transition-transform duration-300 md:transition-none md:translate-x-0 absolute md:relative w-full md:w-auto print:!absolute print:!inset-0 print:!w-full print:!h-auto print:!block print:!transform-none print:z-50 print:bg-white"
            style={{ 
              width: isMobile ? '100%' : (isEditorCollapsed ? '100%' : `${100 - splitPos}%`), 
              transform: isMobile ? (activeTab === 'preview' ? 'translateX(0)' : 'translateX(100%)') : 'none',
              position: isMobile ? 'absolute' : 'relative',
              left: 0,
              top: 0
            }}
          >
            <Preview
              content={content}
              pdfConfig={pdfConfig}
              showPDFTimestamp={showPDFTimestamp}
              showPageNumbers={showPageNumbers}
              headerBanner={headerBanner}
              footerBanner={footerBanner}
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

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRenameModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1e2028] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Save File As</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose a name for your document.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="Enter filename..."
                    value={tempFileName}
                    onChange={(e) => setTempFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (pendingAction === 'md') finalizeMDDownload(tempFileName)
                        else if (pendingAction === 'pdf') finalizePDFDownload(tempFileName)
                        setIsRenameModalOpen(false)
                      }
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                    {pendingAction === 'md' ? '.md' : '.pdf'}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    onClick={() => setIsRenameModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    onClick={() => {
                      if (pendingAction === 'md') finalizeMDDownload(tempFileName)
                      else if (pendingAction === 'pdf') finalizePDFDownload(tempFileName)
                      setIsRenameModalOpen(false)
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

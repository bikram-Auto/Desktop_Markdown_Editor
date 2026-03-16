import { useState, useEffect, useCallback, useRef } from 'react'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import StatusBar from './components/StatusBar'
import AuthModal from './components/AuthModal'
import SetPassword from './components/SetPassword'
import { ToastContainer, useToast } from './components/Toast'
import { User } from './api/users'
import { createPreferences, updatePreferences, getPreferences, SavedPreference } from './api/preferences'
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
  const queryParams = new URLSearchParams(window.location.search)
  const isSetPasswordView = queryParams.has('id')

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
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  // Banner State
  const [headerBanner, setHeaderBanner] = useState('')
  const [footerBanner, setFooterBanner] = useState('')

  // Save As Modal State
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')

  // Saved Preferences Modal State
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false)
  const [savedPrefs, setSavedPrefs] = useState<SavedPreference[]>([])
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false)

  // Toast
  const { toasts, showToast, dismissToast } = useToast()

  // User Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  // Preferences State
  const [preferenceId, setPreferenceId] = useState<string | null>(() => {
    return localStorage.getItem('preferenceId')
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (preferenceId) localStorage.setItem('preferenceId', preferenceId)
    else localStorage.removeItem('preferenceId')
  }, [preferenceId])

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

  const handleLogout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('token')
    setPreferenceId(null)
  }, [])

  const buildLayout = useCallback(() => {
    return {
      content,
      fileName,
      theme,
      splitPos,
      showPDFTimestamp,
      showPageNumbers,
      pdfConfig,
      isEditorCollapsed,
    }
  }, [content, fileName, theme, splitPos, showPDFTimestamp, showPageNumbers, pdfConfig, isEditorCollapsed])

  const handleSave = useCallback(async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const payload = { userId: user.id, layout: buildLayout() }
      if (preferenceId) {
        await updatePreferences(preferenceId, payload)
        showToast('Changes saved successfully!', 'success')
      } else {
        const res = await createPreferences(user.id, payload)
        if (res.id) setPreferenceId(res.id)
        showToast('Saved successfully!', 'success')
      }
      setIsDirty(false)
    } catch (err) {
      console.error('Save failed:', err)
      showToast(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }, [user, preferenceId, buildLayout])

  const handleSaveAsClick = useCallback(() => {
    if (!user) return
    setSaveAsName(fileName.replace(/\.md$/i, ''))
    setIsSaveAsModalOpen(true)
  }, [user, fileName])

  const handleOpenPrefs = useCallback(async () => {
    if (!user) return
    setIsPrefsModalOpen(true)
    setIsLoadingPrefs(true)
    try {
      const prefs = await getPreferences(user.id)
      setSavedPrefs(Array.isArray(prefs) ? prefs : [])
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
      showToast('Failed to load saved preferences', 'error')
      setSavedPrefs([])
    } finally {
      setIsLoadingPrefs(false)
    }
  }, [user])

  const handleLoadPreference = useCallback((pref: SavedPreference) => {
    const layout = pref.layout || {}
    if (layout.content !== undefined) setContent(layout.content)
    if (layout.fileName) setFileName(layout.fileName)
    if (layout.theme) setTheme(layout.theme)
    if (layout.splitPos) setSplitPos(layout.splitPos)
    if (layout.showPDFTimestamp !== undefined) setShowPDFTimestamp(layout.showPDFTimestamp)
    if (layout.showPageNumbers !== undefined) setShowPageNumbers(layout.showPageNumbers)
    if (layout.pdfConfig) setPdfConfig(layout.pdfConfig)
    if (layout.isEditorCollapsed !== undefined) setIsEditorCollapsed(layout.isEditorCollapsed)
    setPreferenceId(pref.id)
    setIsDirty(false)
    setIsPrefsModalOpen(false)
    showToast(`Loaded "${pref.name || 'Untitled'}"`, 'success')
  }, [])

  const handleSaveAsConfirm = useCallback(async (name: string) => {
    if (!user) return
    setIsSaveAsModalOpen(false)
    setIsSaving(true)
    try {
      const payload = { userId: user.id, name, layout: buildLayout() }
      const res = await createPreferences(user.id, payload)
      if (res.id) setPreferenceId(res.id)
      setIsDirty(false)
      showToast(`"${name}" saved as new preference!`, 'success')
    } catch (err) {
      console.error('Save As failed:', err)
      showToast(`Save As failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }, [user, buildLayout])

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

  if (isSetPasswordView) {
    return (
      <div className={theme}>
        <SetPassword />
      </div>
    )
  }

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
            onOpenAuth={(mode: 'signin' | 'signup') => {
              setAuthMode(mode)
              setIsAuthModalOpen(true)
            }}
            user={user}
            onLogout={handleLogout}
            onSave={handleSave}
            onSaveAs={handleSaveAsClick}
            isSaving={isSaving}
            preferenceId={preferenceId}
            onOpenPrefs={handleOpenPrefs}
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

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onAuthSuccess={(userData: User) => setUser(userData)}
      />

      {/* Save As Modal */}
      {isSaveAsModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSaveAsModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1e2028] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v6" />
                    <polyline points="7 3 7 8 15 8" />
                    <path d="M17 17l3 3m0-3l-3 3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Save As New</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose a name for this preference</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="My Preference Name"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && saveAsName.trim()) {
                      handleSaveAsConfirm(saveAsName.trim())
                    }
                  }}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    onClick={() => setIsSaveAsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={!saveAsName.trim()}
                    onClick={() => handleSaveAsConfirm(saveAsName.trim())}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Saved Preferences Modal */}
      {isPrefsModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPrefsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1e2028] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Saved Preferences</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Load a previously saved workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrefsModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="max-h-[340px] overflow-y-auto -mx-2 px-2 space-y-2">
                {isLoadingPrefs ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                    <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                ) : savedPrefs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-sm font-medium">No saved preferences yet</span>
                    <span className="text-xs mt-1">Use Save As to create one</span>
                  </div>
                ) : (
                  savedPrefs.map((pref) => (
                    <button
                      key={pref.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group hover:shadow-md active:scale-[0.98] ${
                        pref.id === preferenceId
                          ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                      onClick={() => handleLoadPreference(pref)}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        pref.id === preferenceId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      } transition-colors`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {pref.name || pref.layout?.fileName || 'Untitled'}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          {pref.updatedAt ? new Date(pref.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                        </p>
                      </div>
                      {pref.id === preferenceId && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15 px-2 py-0.5 rounded-full shrink-0">Active</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

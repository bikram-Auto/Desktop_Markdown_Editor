import React, { useState, useRef, useEffect } from 'react'
import type { PDFConfig } from '../App'

interface ToolbarProps {
  theme: 'dark' | 'light'
  isDirty: boolean
  fileName: string
  onNew: () => void
  onOpen: () => void
  onDownload: () => void
  onDownloadPDF: () => void
  onInsertImage: () => void
  onToggleTheme: () => void
  onRename: (newName: string) => void
  onInsertPageBreak: () => void
  showPDFTimestamp: boolean
  onTogglePDFTimestamp: () => void
  pdfConfig: PDFConfig
  onUpdatePDFConfig: (config: Partial<PDFConfig>) => void
  activeTab: 'editor' | 'preview'
  onTabChange: (tab: 'editor' | 'preview') => void
}


export default function Toolbar({
  theme,
  isDirty,
  fileName,
  onNew,
  onOpen,
  onDownload,
  onDownloadPDF,
  onInsertImage,
  onToggleTheme,
  onRename,
  onInsertPageBreak,
  showPDFTimestamp,
  onTogglePDFTimestamp,
  pdfConfig,
  onUpdatePDFConfig,
  activeTab,
  onTabChange,
}: ToolbarProps) {

  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [tempFileName, setTempFileName] = useState(fileName)

  const menuRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Sync temp name when actual filename changes externally
  useEffect(() => {
    setTempFileName(fileName)
  }, [fileName])

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [isRenaming])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleRenameSubmit = () => {
    const trimmed = tempFileName.trim()
    if (trimmed && trimmed !== fileName) {
      onRename(trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`)
    } else {
      setTempFileName(fileName)
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit()
    if (e.key === 'Escape') {
      setTempFileName(fileName)
      setIsRenaming(false)
    }
  }


  return (
    <div className="toolbar">
      <div className="toolbar__logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2" y="4" width="20" height="16" rx="3" fill="currentColor" opacity="0.15" />
          <path d="M6 8h12M6 12h8M6 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="toolbar__app-name">genPdf</span>
      </div>

      <div className="toolbar__file-area hide-mobile">
        {isDirty && <span className="toolbar__dirty-dot" title="Unsaved changes" />}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            className="toolbar__file-input"
            value={tempFileName}
            onChange={(e) => setTempFileName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div
            className="toolbar__file-display"
            onClick={() => setIsRenaming(true)}
            title="Click to rename"
          >
            <span className="toolbar__file-name">{fileName}</span>
            <IconEdit />
          </div>
        )}
      </div>


      <div className="toolbar__actions">
        <button className="toolbar__btn" onClick={onNew} title="New file">
          <IconNew />
          <span className="hide-mobile">New</span>
        </button>


        <button className="toolbar__btn" onClick={onOpen} title="Open file">
          <IconOpen />
          <span className="hide-mobile">Open</span>
        </button>


        <button className="toolbar__btn" onClick={onInsertImage} title="Insert image">
          <IconImage />
          <span className="hide-mobile">Image</span>
        </button>


        <button className="toolbar__btn" onClick={onInsertPageBreak} title="Insert Page Break">
          <IconPageBreak />
          <span className="hide-mobile">Page Break</span>
        </button>

        <div className="toolbar__mobile-tabs">
          <button
            className={`toolbar__tab ${activeTab === 'editor' ? 'toolbar__tab--active' : ''}`}
            onClick={() => onTabChange('editor')}
          >
            Edit
          </button>
          <button
            className={`toolbar__tab ${activeTab === 'preview' ? 'toolbar__tab--active' : ''}`}
            onClick={() => onTabChange('preview')}
          >
            Preview
          </button>
        </div>


        <div className="toolbar__divider" />

        {/* 3-dot menu */}
        <div className="menu-container" ref={menuRef}>
          <button
            className={`toolbar__btn toolbar__btn--icon ${menuOpen ? 'toolbar__btn--active' : ''}`}
            onClick={() => { setMenuOpen(!menuOpen) }}
            title="More options"
          >
            <IconDots />
          </button>

          {menuOpen && (
            <div className="menu-popup">
              <div className="menu-popup__section-title">File</div>
              <button
                className="menu-popup__item"
                onClick={() => { onDownload(); setMenuOpen(false) }}
              >
                <div className="menu-popup__icon-wrap"><IconDownload /></div>
                <div className="menu-popup__text">
                  <span className="menu-popup__label">Download Markdown</span>
                  <span className="menu-popup__desc">Save content as .md file</span>
                </div>
              </button>

              <button
                className="menu-popup__item"
                onClick={() => { onDownloadPDF(); setMenuOpen(false) }}
              >
                <div className="menu-popup__icon-wrap"><IconPDF /></div>
                <div className="menu-popup__text">
                  <span className="menu-popup__label">Export as PDF</span>
                  <span className="menu-popup__desc">Document for printing</span>
                </div>
              </button>

              <div className="menu-popup__divider" />
              <div className="menu-popup__section-title">Settings</div>

              <button
                className={`menu-popup__item ${showPDFTimestamp ? 'menu-popup__item--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePDFTimestamp();
                }}
              >
                <div className="menu-popup__icon-wrap">
                  {showPDFTimestamp ? <IconCheck /> : <div style={{ width: 16, height: 16 }} />}
                </div>
                <div className="menu-popup__text">
                  <span className="menu-popup__label">PDF Timestamp</span>
                  <span className="menu-popup__desc">Include date/time on PDF</span>
                </div>
              </button>

              <div className="menu-popup__divider" />
              <div className="menu-popup__section-title">Page Setup</div>

              <div className="menu-popup__setup-row">
                <span className="menu-popup__setup-label">Size</span>
                <select
                  className="menu-popup__select"
                  value={pdfConfig.format}
                  onChange={(e) => onUpdatePDFConfig({ format: e.target.value as any })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>

              <div className="menu-popup__setup-row">
                <span className="menu-popup__setup-label">Orientation</span>
                <select
                  className="menu-popup__select"
                  value={pdfConfig.orientation}
                  onChange={(e) => onUpdatePDFConfig({ orientation: e.target.value as any })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div className="menu-popup__setup-row">
                <span className="menu-popup__setup-label">Margin</span>
                <select
                  className="menu-popup__select"
                  value={pdfConfig.margin}
                  onChange={(e) => onUpdatePDFConfig({ margin: parseFloat(e.target.value) })}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="0.2">Small (0.2in)</option>
                  <option value="0.5">Normal (0.5in)</option>
                  <option value="0.8">Large (0.8in)</option>
                  <option value="1.0">Extra Large (1.0in)</option>
                </select>
              </div>

              <div className="menu-popup__setup-row">
                <span className="menu-popup__setup-label">Header</span>
                <input
                  type="text"
                  className="menu-popup__select"
                  placeholder="Custom header..."
                  value={pdfConfig.headerText}
                  onChange={(e) => onUpdatePDFConfig({ headerText: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', padding: '4px 8px' }}
                />
              </div>

              <div className="menu-popup__setup-row">
                <span className="menu-popup__setup-label">Footer</span>
                <input
                  type="text"
                  className="menu-popup__select"
                  placeholder="Custom footer..."
                  value={pdfConfig.footerText}
                  onChange={(e) => onUpdatePDFConfig({ footerText: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', padding: '4px 8px' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="toolbar__divider" />

        <button
          className="toolbar__btn toolbar__btn--icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </div>
  )
}

/* ── Icons ── */

function IconNew() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}

function IconOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconImage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function IconDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconPDF() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15h2" />
      <path d="M9 11h2" />
      <path d="M9 19h2" />
    </svg>
  )
}



function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconPageBreak() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M4 12h16" strokeDasharray="4 2" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

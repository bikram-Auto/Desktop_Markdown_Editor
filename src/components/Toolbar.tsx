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
  onInsertPageBreak: () => void
  showPDFTimestamp: boolean
  onTogglePDFTimestamp: () => void
  showPageNumbers: boolean
  onTogglePageNumbers: () => void
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
  onInsertPageBreak,
  showPDFTimestamp,
  onTogglePDFTimestamp,
  showPageNumbers,
  onTogglePageNumbers,
  pdfConfig,
  onUpdatePDFConfig,
  activeTab,
  onTabChange,
}: ToolbarProps) {

  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (downloadMenuOpen && downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false)
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [downloadMenuOpen, profileMenuOpen])

  const btnBase = "flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg cursor-pointer border border-transparent bg-transparent text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white active:scale-95 shrink-0"

  return (
    <div className="flex items-center justify-between h-14 px-3 md:px-5 bg-white dark:bg-[#1a1c23] border-b border-gray-200 dark:border-[#2d3139] shrink-0 relative z-50">

      {/* LEFT: Logo + Actions */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        {/* Logo */}
        <div className="flex items-center text-blue-600 dark:text-blue-400 mr-1 md:mr-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="2" y="4" width="20" height="16" rx="4" fill="currentColor" opacity="0.15" />
            <path d="M6 8h12M6 12h8M6 16h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Action Buttons */}
        <button className={btnBase} onClick={onNew} title="New file">
          <IconNew />
          <span className="hidden lg:inline text-xs font-medium">New</span>
        </button>

        <button className={btnBase} onClick={onOpen} title="Open file">
          <IconOpen />
          <span className="hidden lg:inline text-xs font-medium">Open</span>
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 hidden sm:block" />

        <button className={btnBase} onClick={onInsertImage} title="Insert Image">
          <IconImage />
          <span className="hidden lg:inline text-xs font-medium">Image</span>
        </button>

        <button className={btnBase} onClick={onInsertPageBreak} title="Insert Page Break">
          <IconPageBreak />
          <span className="hidden lg:inline text-xs font-medium">Break</span>
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 hidden sm:block" />

        <button
          className={`${btnBase} ${showPDFTimestamp ? '!text-blue-600 dark:!text-blue-400 !bg-blue-50 dark:!bg-blue-500/10' : ''}`}
          onClick={onTogglePDFTimestamp}
          title="Toggle PDF Timestamp"
        >
          {showPDFTimestamp ? <IconCheck /> : <span className="w-4 h-4" />}
          <span className="hidden lg:inline text-xs font-medium">Timestamp</span>
        </button>

        <button
          className={`${btnBase} ${showPageNumbers ? '!text-blue-600 dark:!text-blue-400 !bg-blue-50 dark:!bg-blue-500/10' : ''}`}
          onClick={onTogglePageNumbers}
          title="Toggle PDF Page Numbers"
        >
          {showPageNumbers ? <IconCheck /> : <span className="w-4 h-4" />}
          <span className="hidden lg:inline text-xs font-medium">Page #</span>
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 hidden xl:block" />

        {/* Page Setup Controls – visible on xl+ */}
        <div className="hidden xl:flex items-center gap-1.5 ml-1">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-md px-2 py-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Size</span>
            <select
              className="bg-transparent border-none text-gray-800 dark:text-gray-200 text-xs font-medium outline-none cursor-pointer"
              value={pdfConfig.format}
              onChange={(e) => onUpdatePDFConfig({ format: e.target.value as any })}
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md px-2 py-1">
            <select
              className="bg-transparent border-none text-gray-800 dark:text-gray-200 text-xs font-medium outline-none cursor-pointer"
              value={pdfConfig.orientation}
              onChange={(e) => onUpdatePDFConfig({ orientation: e.target.value as any })}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-md px-2 py-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Margin</span>
            <select
              className="bg-transparent border-none text-gray-800 dark:text-gray-200 text-xs font-medium outline-none cursor-pointer"
              value={pdfConfig.margin}
              onChange={(e) => onUpdatePDFConfig({ margin: parseFloat(e.target.value) })}
            >
              <option value="0.2">0.2 in</option>
              <option value="0.5">0.5 in</option>
              <option value="0.8">0.8 in</option>
              <option value="1.0">1.0 in</option>
            </select>
          </div>
        </div>
      </div>

      {/* CENTER: File name + Mobile tabs */}
      <div className="flex flex-col items-center justify-center min-w-0 mx-2 md:mx-4">
        <div className="flex items-center gap-2">
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]" title="Unsaved changes" />}
          <span className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-[120px] md:max-w-[200px]">{fileName}</span>
        </div>
        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-gray-100 dark:bg-white/5 p-0.5 rounded-md mt-1">
          <button
            className={`px-3 py-1 text-[11px] font-semibold rounded border-none cursor-pointer transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-[#2d3139] text-blue-600 dark:text-blue-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-gray-400'}`}
            onClick={() => onTabChange('editor')}
          >Edit</button>
          <button
            className={`px-3 py-1 text-[11px] font-semibold rounded border-none cursor-pointer transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-[#2d3139] text-blue-600 dark:text-blue-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-gray-400'}`}
            onClick={() => onTabChange('preview')}
          >Preview</button>
        </div>
      </div>

      {/* RIGHT: Download + Profile */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">

        {/* Download Button + Dropdown */}
        <div className="relative" ref={downloadMenuRef}>
          <button
            className="flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-lg font-semibold text-[13px] cursor-pointer border-none bg-blue-600 dark:bg-blue-500 text-white transition-all shadow-sm hover:bg-blue-700 dark:hover:bg-blue-400 hover:shadow-md active:scale-95"
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            title="Download options"
          >
            <IconDownload />
            <span className="hidden md:inline">Download</span>
            <IconChevronDown />
          </button>

          {downloadMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1.5 z-[9999]">
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent rounded-lg cursor-pointer text-gray-800 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                onClick={() => { onDownload(); setDownloadMenuOpen(false) }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span className="font-bold text-[11px]">MD</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">Markdown</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Save as .md file</span>
                </div>
              </button>

              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent rounded-lg cursor-pointer text-gray-800 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                onClick={() => { onDownloadPDF(); setDownloadMenuOpen(false) }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <IconPDF />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">PDF</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Share or print format</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden md:block" />

        {/* Profile Avatar + Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/40 active:scale-95 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm border-none"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            title="Profile & Settings"
          >
            <span className="text-sm font-bold">U</span>
          </button>

          {profileMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1.5 z-[9999]">

              {/* Mode Toggle */}
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent rounded-lg cursor-pointer text-gray-800 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                onClick={() => { onToggleTheme(); }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-yellow-500 transition-colors">
                  {theme === 'dark' ? <IconSun /> : <IconMoon />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Switch appearance</span>
                </div>
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-1 mx-2" />

              {/* Header Text */}
              <div className="px-3 py-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Header Text</label>
                <input
                  type="text"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-md text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  placeholder="e.g. Company Name"
                  value={pdfConfig.headerText}
                  onChange={(e) => onUpdatePDFConfig({ headerText: e.target.value })}
                />
              </div>

              {/* Footer Text */}
              <div className="px-3 py-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Footer Text</label>
                <input
                  type="text"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-md text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  placeholder="e.g. Confidential"
                  value={pdfConfig.footerText}
                  onChange={(e) => onUpdatePDFConfig({ footerText: e.target.value })}
                />
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-1 mx-2" />

              {/* Sign In */}
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent rounded-lg cursor-pointer text-gray-800 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                onClick={() => { setProfileMenuOpen(false); alert('Sign In clicked') }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  <IconSignIn />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">Sign In</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Access your account</span>
                </div>
              </button>

              {/* Sign Up */}
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent rounded-lg cursor-pointer text-gray-800 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                onClick={() => { setProfileMenuOpen(false); alert('Sign Up clicked') }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <IconSignUp />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">Sign Up</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Create new account</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Icons ── */

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

function IconSignIn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

function IconSignUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
}

import { useMemo, useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // Clean, professional theme

import type { PDFConfig } from '../App'
import { getBlobUrl } from '../utils/imageStorage'

// const [isPrintMode, setIsPrintMode] = useState(false)

// useEffect(() => {
//   const media = window.matchMedia('print')

//   const listener = () => setIsPrintMode(media.matches)

//   media.addEventListener('change', listener)
//   setIsPrintMode(media.matches)

//   return () => media.removeEventListener('change', listener)
// }, [])

interface PreviewProps {
  content: string
  pdfConfig: PDFConfig
  showPDFTimestamp: boolean
  showPageNumbers: boolean
  headerBanner?: string
  footerBanner?: string
}

// Configure marked globally with base options
marked.setOptions({
  gfm: true,
  breaks: true,
} as any)

export default function Preview({ content, pdfConfig, showPDFTimestamp, showPageNumbers, headerBanner, footerBanner }: PreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenMeasureRef = useRef<HTMLDivElement>(null)
  const [paginatedPages, setPaginatedPages] = useState<string[]>([])
  const [zoom, setZoom] = useState(1);
  const [hashToUrl, setHashToUrl] = useState<Record<string, string>>({});

  const [isPrintMode, setIsPrintMode] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('print')

    const listener = () => setIsPrintMode(media.matches)

    media.addEventListener('change', listener)
    setIsPrintMode(media.matches)

    return () => media.removeEventListener('change', listener)
  }, [])

  // Resolve hashes to Blob URLs
  useEffect(() => {
    const hashRegex = /!\[.*?\]\s*\(([a-f0-9]{64})\)/g
    const matches = [...content.matchAll(hashRegex)]

    const hashes = matches.map(m => m[1])

    Promise.all(
      hashes.map(async (h) => {
        if (hashToUrl[h]) return null
        const url = await getBlobUrl(h)
        return { hash: h, url }
      })
    ).then(results => {
      const updates: Record<string, string> = {}

      results.forEach(r => {
        if (r && r.url) updates[r.hash] = r.url
      })

      if (Object.keys(updates).length) {
        setHashToUrl(prev => ({ ...prev, ...updates }))
      }
    })
  }, [content, hashToUrl])

  // Parse markdown → sanitized HTML
  const fullHtml = useMemo(() => {
    // Configure marked with a custom renderer for images
    const renderer = new marked.Renderer();
    
    // Support highlight.js in code blocks
    renderer.code = (code: string, lang: string | undefined) => {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(code, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    };

    renderer.image = (href: string, title: string | null, text: string) => {
      // If href is a hash that we've resolved, use the Blob URL
      const actualUrl = hashToUrl[href] || href;
      return `<img src="${actualUrl}" alt="${text}" ${title ? `title="${title}"` : ''} data-hash="${href}" />`;
    };

    const raw = marked.parse(content, { renderer, async: false }) as string;
    
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'del', 'code', 'pre', 'blockquote',
        'ul', 'ol', 'li',
        'a', 'img',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'details', 'summary',
        'span', 'div',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'align', 'style', 'data-hash'],
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['style', 'script'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  }, [content, hashToUrl])

  // Calculation for page height in pixels
  const formatHeights: Record<string, number> = {
    'a4-portrait': 297,
    'a4-landscape': 210,
    'letter-portrait': 11 * 25.4,
    'letter-landscape': 8.5 * 25.4,
    'legal-portrait': 14 * 25.4,
    'legal-landscape': 8.5 * 25.4
  }

  const formatWidths: Record<string, number> = {
    'a4-portrait': 210,
    'a4-landscape': 297,
    'letter-portrait': 8.5 * 25.4,
    'letter-landscape': 11 * 25.4,
    'legal-portrait': 8.5 * 25.4,
    'legal-landscape': 14 * 25.4
  }

  // Auto-Pagination Logic
  useEffect(() => {
    if (isPrintMode) return


    const measureEl = hiddenMeasureRef.current
    if (!measureEl) return

    measureEl.innerHTML = fullHtml

    const key = `${pdfConfig.format}-${pdfConfig.orientation}`

    const totalPageHeightMm = formatHeights[key] || 297
    const totalHeightPx = (totalPageHeightMm * 96) / 25.4

    const marginPx = pdfConfig.margin * 96

    // Account for banners and internal paddings (pt-6 + pb-6 = 48px)
    // We estimate banner space if present to ensure pagination matches reality
    const bannerEstimate = (headerBanner ? 60 : 0) + (footerBanner ? 60 : 0)
    const usableHeight = totalHeightPx - marginPx * 2 - 48 - bannerEstimate

    const pages: string[] = []

    let currentPageHTML = ''
    let currentHeight = 0

    const elements = Array.from(measureEl.children) as HTMLElement[]

    elements.forEach((el) => {

      // Handle manual page break
      if (el.classList.contains('page-break')) {
        if (currentPageHTML !== '') {
          pages.push(currentPageHTML)
          currentPageHTML = ''
          currentHeight = 0
        }
        return
      }

      const elHeight = el.getBoundingClientRect().height

      if (currentHeight + elHeight > usableHeight && currentPageHTML !== '') {
        pages.push(currentPageHTML)
        currentPageHTML = ''
        currentHeight = 0
      }

      currentPageHTML += el.outerHTML
      currentHeight += elHeight
    })

    if (currentPageHTML) pages.push(currentPageHTML)

    setPaginatedPages(pages)
  }, [fullHtml, pdfConfig.format, pdfConfig.orientation, pdfConfig.margin])

  // Dynamic Scaling / Center alignment
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || isPrintMode) return

    const updateScale = () => {
      const key = `${pdfConfig.format}-${pdfConfig.orientation}`
      const targetWidthMm = formatWidths[key] || 210
      const targetWidthPx = (targetWidthMm * 96) / 25.4

      // Calculate how much space we actually have
      // Padding/buffer: 32px (16px each side)
      const availableWidth = wrapper.clientWidth - 32

      const scaleToFit = availableWidth / targetWidthPx

      // We strictly match the page ratio but scale it down to fit the screen
      // If it's already smaller than the screen (Desktop), we keep it at 100% (1)
      setZoom(Math.min(scaleToFit, 1))
    }

    const observer = new ResizeObserver(updateScale)
    observer.observe(wrapper)
    updateScale()

    return () => observer.disconnect()
  }, [pdfConfig.format, pdfConfig.orientation, isPrintMode])

  // Update Page Indicator on scroll
  useEffect(() => {
    const wrapper = wrapperRef.current
    const container = containerRef.current
    if (!wrapper || !container) return

    const handleScroll = () => {
      const cards = container.querySelectorAll('.preview-content')
      if (cards.length === 0) return
      const wrapperRect = wrapper.getBoundingClientRect()
      const wrapperCenter = wrapperRect.top + wrapperRect.height / 3

      let currentPage = 1
      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect()
        if (cardRect.top <= wrapperCenter) currentPage = index + 1
      })

      const indicator = wrapper.querySelector('.preview-page-indicator')
      if (indicator) indicator.textContent = `PAGE ${currentPage}`
    }

    wrapper.addEventListener('scroll', handleScroll)
    return () => wrapper.removeEventListener('scroll', handleScroll)
  }, [paginatedPages]) // depend on paginatedPages

  // Open links in external browser via Electron
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (anchor && anchor.href.startsWith('http')) {
        e.preventDefault()
        window.open(anchor.href, '_blank')
      }
    }
    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [])

  const pagesToRender = paginatedPages.length ? paginatedPages : [fullHtml];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto h-full bg-gray-100 dark:bg-[#0f1115] print:bg-white print:overflow-visible print:h-auto print:block flex flex-col justify-start items-center" ref={wrapperRef}>
      {/* Hidden container for measurement */}
      <div
        ref={hiddenMeasureRef}
        className="prose dark:prose-invert max-w-none break-words print:!max-w-none"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: pdfConfig.orientation === 'portrait' ? `${formatWidths[`${pdfConfig.format}-portrait`]}mm` : `${formatWidths[`${pdfConfig.format}-landscape`]}mm`,
          padding: `${pdfConfig.margin}in`,
          boxSizing: 'border-box'
        }}
      />

      <div
        className="preview-page-container flex flex-col items-center py-6 gap-6 min-h-full print:py-0 print:gap-0 print:block print:w-full print:m-0 w-full max-w-full"
        ref={containerRef}
        style={{
          '--page-margin': `${pdfConfig.margin}in`,
          transform: isPrintMode ? 'none' : `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out'
        } as any}
      >

        {pagesToRender.map((pageHtml: string, index: number) => (
          <div
            key={index + '-' + showPageNumbers + '-' + showPDFTimestamp}
            className="preview-content bg-white dark:bg-[#16181d] shadow-md dark:shadow-xl shrink-0 prose dark:prose-invert !max-w-none break-words print:!shadow-none print:!bg-transparent print:!m-0"
            style={{
              width: pdfConfig.orientation === 'portrait'
                ? `${formatWidths[`${pdfConfig.format}-portrait`]}mm`
                : `${formatWidths[`${pdfConfig.format}-landscape`]}mm`,
              height: pdfConfig.orientation === 'portrait'
                ? `${formatHeights[`${pdfConfig.format}-portrait`]}mm`
                : `${formatHeights[`${pdfConfig.format}-landscape`]}mm`,
              padding: `${pdfConfig.margin}in`,
              position: 'relative',
              pageBreakAfter: index < pagesToRender.length - 1 ? 'always' : 'auto'
            }}
          >
            {headerBanner && (
              <div
                className="w-full mb-4 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: headerBanner }}
              />
            )}
            {pdfConfig.headerText && (
              <div
                className="absolute top-4 left-0 right-0 text-center text-[10px] text-gray-400 font-mono z-10"
                dangerouslySetInnerHTML={{ __html: pdfConfig.headerText }}
              />
            )}
            {showPDFTimestamp && (
              <div className="absolute top-4 left-4 text-[10px] text-gray-400 font-mono z-10">
                {new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {/* Added a safe container with padding to prevent content from hitting the absolute overlays */}
            <div className="relative pt-6 pb-6" dangerouslySetInnerHTML={{ __html: pageHtml }} />
            {footerBanner && (
              <div
                className="w-full mt-4 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: footerBanner }}
              />
            )}
            {pdfConfig.footerText && (
              <div
                className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 font-mono z-10"
                dangerouslySetInnerHTML={{ __html: pdfConfig.footerText }}
              />
            )}
            {showPageNumbers && (
              <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 font-mono z-10">
                {index + 1}/{pagesToRender.length}
              </div>
            )}
          </div>
        ))}
        {/* Placeholder for page indicator logic if needed */}
      </div>
    </div>
  )
}

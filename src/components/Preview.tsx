import { useMemo, useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // Clean, professional theme
import '../styles/preview.css'

import type { PDFConfig } from '../App'

interface PreviewProps {
  content: string
  pdfConfig: PDFConfig
}

// Configure marked to use highlight.js
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function (code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
} as any)

export default function Preview({ content, pdfConfig }: PreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenMeasureRef = useRef<HTMLDivElement>(null)
  const [paginatedPages, setPaginatedPages] = useState<string[]>([])

  // Parse markdown → sanitized HTML
  const fullHtml = useMemo(() => {
    const raw = marked.parse(content) as string
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
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    })
  }, [content])

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
    const measureEl = hiddenMeasureRef.current
    if (!measureEl) return

    // Render full HTML to measure
    measureEl.innerHTML = fullHtml

    // Wait a bit for images/styles to load if any (though marked is sync)
    // For robust measurement, we use rAF
    const doPagination = () => {
      const key = `${pdfConfig.format}-${pdfConfig.orientation}`
      const totalPageHeightMm = formatHeights[key] || 297
      const totalPageWidthMm = formatWidths[key] || 210

      // PPI approx 96
      const totalHeightPx = (totalPageHeightMm * 96) / 25.4
      const marginPx = (pdfConfig.margin * 96)
      const maxContentHeight = totalHeightPx - (marginPx * 2)

      const pages: string[][] = [[]]
      let currentPageHeight = 0

      const children = Array.from(measureEl.children)

      children.forEach((child) => {
        const childHeight = (child as HTMLElement).offsetHeight
        const isManualBreak = child.classList.contains('page-break')

        if (isManualBreak) {
          if (currentPageHeight > 0) {
            pages.push([])
            currentPageHeight = 0
          }
          return // skip the break div itself
        }

        if (currentPageHeight + childHeight > maxContentHeight && currentPageHeight > 0) {
          pages.push([])
          currentPageHeight = 0
        }

        pages[pages.length - 1].push(child.outerHTML)
        currentPageHeight += childHeight
      })

      setPaginatedPages(pages.map(p => p.join('')))
    }

    requestAnimationFrame(doPagination)
  }, [fullHtml, pdfConfig.format, pdfConfig.orientation, pdfConfig.margin])

  // Dynamic Scaling Logic
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const updateScale = () => {
      const key = `${pdfConfig.format}-${pdfConfig.orientation}`
      const targetWidthMm = formatWidths[key] || 210
      const targetWidthPx = (targetWidthMm * 96) / 25.4
      const availableWidth = wrapper.clientWidth - 80
      const scale = Math.min(1, availableWidth / targetWidthPx)
      wrapper.style.setProperty('--preview-scale', scale.toString())
    }

    const observer = new ResizeObserver(updateScale)
    observer.observe(wrapper)
    updateScale()

    return () => observer.disconnect()
  }, [pdfConfig.format, pdfConfig.orientation])

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

  return (
    <div className="preview-wrapper" ref={wrapperRef}>
      {/* Hidden container for measurement */}
      <div
        ref={hiddenMeasureRef}
        className="markdown-body"
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
        className="preview-page-container"
        ref={containerRef}
        data-format={pdfConfig.format}
        data-orientation={pdfConfig.orientation}
        style={{
          '--page-margin': `${pdfConfig.margin}in`
        } as any}
      >
        {paginatedPages.map((pageHtml: string, index: number) => (
          <div
            key={index}
            className="preview-content markdown-body"
          >
            {pdfConfig.headerText && <div className="preview-custom-header">{pdfConfig.headerText}</div>}
            <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
            {pdfConfig.footerText && <div className="preview-custom-footer">{pdfConfig.footerText}</div>}
          </div>
        ))}
        <div className="preview-page-indicator">PAGE 1</div>
      </div>
    </div>
  )
}

<div align="center">
  <img src="public/markdown.svg" width="80" height="80" alt="genPdf Logo" />
  <h1>genPdf</h1>
  <p><strong>A modern, fast, and feature-rich Markdown Editor</strong></p>
  <p>
    <a href="https://desktop-markdown-editor.web.app">Live Demo</a> •
    <a href="#key-features">Key Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#technical-overview">Technical Overview</a>
  </p>
</div>

---

genPdf is designed for users who need a high-fidelity Markdown writing environment with tight control over physical document layout. Unlike traditional editors, genPdf treats your document as a series of physical pages, ensuring that what you see in the preview is exactly what you get in your PDF export.

## Key Features

- **Real-time WYSIWYG Preview**: Experience GitHub-flavored Markdown rendering as you type, with automatic syntax highlighting for code blocks.
- **Physical Page Management**: 
  - **Auto-Pagination**: Automatically splits long content into A4, Letter, or Legal pages.
  - **Manual Breaks**: Insert `<div class="page-break"></div>` to force content onto a new page.
  - **Scale-to-Fit**: The preview pane perfectly reflects the physical dimensions and margins of your chosen format.
- **Advanced PDF Export**:
  - High-precision rendering that respects system print settings.
  - Customizable header/footer text with optional automated page numbering.
  - Visual timestamps for document versioning.
  - Branded experience via custom HTML banners for headers and footers.
- **Smart Image Handling**:
  - **Local Persistence**: Images are compressed and stored in IndexedDB using SHA-256 hashing.
  - **Optimized Performance**: Small Markdown file sizes as images are referenced by hash rather than embedded as heavy Base64 strings.
  - **Automated Cleanup**: The application automatically identifies and removes unused image blobs to keep local storage clean.

## Technical Overview

The application is built with a modern, high-performance stack:

| Component | Technology |
| :--- | :--- |
| **Core** | React 18 + TypeScript |
| **Editor** | Monaco Editor (VS Code's engine) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Parsing** | marked.js + highlight.js |
| **Security** | DOMPurify for HTML sanitization |
| **Storage** | IndexedDB with SHA-256 hashing for offline image support |

## Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Desktop_Markdown_Editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Deployment

The project is configured for Firebase Hosting. To deploy your own instance:
```bash
npm run build
firebase deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

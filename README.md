# genPdf

A modern, fast, and feature-rich Markdown Editor built with React. It provides real-time preview, intelligent auto-pagination, and high-quality PDF exports designed to give you precise control over your document's physical layout.

![genPdf](https://desktop-markdown-editor.web.app/favicon.ico) <!-- Placeholder, replace if a real screenshot is available online -->

## 🚀 Live Demo
[https://desktop-markdown-editor.web.app](https://desktop-markdown-editor.web.app)

## ✨ Features

- **Live Markdown Preview**: See your Markdown rendered in real-time as you type, complete with GitHub-flavored styling and syntax highlighting.
- **Intelligent Auto-Pagination**: Long documents are automatically split into physical "page cards" in the preview based on your selected page size—no manual page breaks required.
- **Physical Page Sync**: The preview pane perfectly scales to reflect true A4, Letter, or Legal dimensions, giving you a true WYSIWYG (What You See Is What You Get) experience before printing.
- **Advanced PDF Export**:
  - Export directly to high-quality PDF.
  - Native margin handling prevents content from overlapping with headers/footers.
  - Customizable page format (A4, Letter, Legal) and orientation (Portrait, Landscape).
  - Add custom Header and Footer text.
  - Optional visual timestamps and automatic page numbering.
- **Mobile Optimized**: A fully responsive design featuring a tabbed interface (Edit/Preview) for seamless use on smartphones and tablets.
- **Dark/Light Mode**: Toggle between beautifully designed light and dark themes.
- **Local File Support**: Open existing `.md` files and download your work locally.
- **Image Support**: Easily insert local images into your markdown.

## 🛠 Technology Stack

- **Frontend Framework**: [React](https://reactjs.org/) (with TypeScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Markdown Parsing**: [marked](https://marked.js.org/)
- **HTML Sanitization**: [DOMPurify](https://github.com/cure53/DOMPurify)
- **Syntax Highlighting**: [highlight.js](https://highlightjs.org/)
- **PDF Generation**: [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- **Hosting**: Firebase Hosting

## 💻 Running Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd Desktop_Markdown_Editor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

### Building for Production
To create an optimized production build:
```bash
npm run build
```
The compiled files will be located in the `dist` directory.

## 📄 License

This project is licensed under the MIT License.

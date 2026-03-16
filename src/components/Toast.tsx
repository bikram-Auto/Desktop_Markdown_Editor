import React, { useEffect, useState } from 'react'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

let toastId = 0

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none print:hidden">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const isSuccess = toast.type === 'success'

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 min-w-[280px] max-w-[400px]
        ${isSuccess
          ? 'bg-green-50/95 dark:bg-green-950/80 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-200'
          : 'bg-red-50/95 dark:bg-red-950/80 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200'
        }
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
      `}
    >
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-500' : 'bg-red-500'} text-white`}>
        {isSuccess ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold flex-1">{toast.message}</p>
      <button
        onClick={() => { setIsExiting(true); setTimeout(() => onDismiss(toast.id), 300) }}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: ++toastId, message, type }])
  }

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, showToast, dismissToast }
}

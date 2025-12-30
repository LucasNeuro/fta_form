import React, { useEffect } from 'react'
import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from 'react-icons/md'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || 4000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const icons = {
    success: <MdCheckCircle className="w-5 h-5 text-fta-green" />,
    error: <MdError className="w-5 h-5 text-red-500" />,
    info: <MdInfo className="w-5 h-5 text-blue-500" />,
    warning: <MdWarning className="w-5 h-5 text-yellow-500" />
  }

  const bgColors = {
    success: 'bg-fta-green/20 border-fta-green/50',
    error: 'bg-red-500/20 border-red-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50'
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[toast.type]} backdrop-blur-sm shadow-lg min-w-[300px] max-w-[500px] animate-slide-in-right`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-white text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-white/60 hover:text-white transition-colors"
      >
        <MdClose className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}




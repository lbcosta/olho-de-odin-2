// src/renderer/components/ui/Toast.tsx
// Container visual dos toasts (canto inferior direito).

import { useToast, type ToastType } from '../../contexts/ToastContext'

const STYLES: Record<ToastType, string> = {
  error: 'border-log-error/50 bg-log-error/15 text-red-200',
  info: 'border-odin-500/40 bg-surface-overlay text-gray-100',
  success: 'border-log-success/50 bg-log-success/15 text-green-200',
}

export function ToastContainer(): React.JSX.Element {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed bottom-12 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className={`pointer-events-auto rounded-lg border px-4 py-2 text-left text-sm shadow-lg ${STYLES[toast.type]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}

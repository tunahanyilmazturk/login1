import { useState, useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error'

export interface Toast {
  type: ToastType
  message: string
}

export function useToast(duration = 2500) {
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), duration)
    return () => clearTimeout(t)
  }, [toast, duration])

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message })
  }, [])

  return { toast, showToast }
}
import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { Toast } from '../hooks/useToast'

export function ToastBar({ toast }: { toast: Toast | null }) {
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.type === 'success' ? <CheckCircle size={16} strokeWidth={2} /> : <AlertTriangle size={16} strokeWidth={2} />}
      {toast.message}
    </div>
  )
}
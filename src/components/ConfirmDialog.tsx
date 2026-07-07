import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog({
  open, title, itemName, onConfirm, onCancel,
}: {
  open: boolean
  title: string
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><AlertTriangle size={18} strokeWidth={1.6} style={{ color: '#ef4444', marginRight: 8 }} /> {title}</h3>
        </div>
        <div className="modal-body">
          <p><strong>{itemName}</strong> öğesini silmek istediğinize emin misiniz?</p>
          <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Bu işlem geri alınamaz.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>İptal</button>
          <button className="btn btn-danger" onClick={onConfirm}>Evet, Sil</button>
        </div>
      </div>
    </div>
  )
}
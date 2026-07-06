import { TrendingUp, UserPlus, FileEdit, ClipboardCheck, FileText } from 'lucide-react'

const quickActions = [
  { label: 'Personel Ekle', icon: UserPlus, color: '#3b82f6' },
  { label: 'Eğitim Aç', icon: FileEdit, color: '#8b5cf6' },
  { label: 'Denetim Başlat', icon: ClipboardCheck, color: '#f59e0b' },
  { label: 'Rapor Oluştur', icon: FileText, color: '#10b981' },
]

export default function QuickActions() {
  return (
    <section className="card quick-card">
      <div className="card-title-row">
        <h3><TrendingUp size={16} strokeWidth={1.8} /> Hızlı İşlemler</h3>
      </div>
      <div className="quick-grid">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button key={action.label} className="quick-item">
              <span className="quick-icon" style={{ background: `${action.color}14`, color: action.color }}>
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
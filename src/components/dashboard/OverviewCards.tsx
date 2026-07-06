import { Activity } from 'lucide-react'

const items = [
  { label: 'Aktif personel', current: 112, total: 124, color: '#3b82f6' },
  { label: 'Eğitim tamamlama', current: 82, total: 100, color: '#10b981' },
  { label: 'Denetim durumu', current: 14, total: 21, color: '#f59e0b' },
  { label: 'Rapor teslim', current: 38, total: 42, color: '#8b5cf6' },
]

export default function OverviewCards() {
  return (
    <section className="card overview-card">
      <div className="card-title-row">
        <h3><Activity size={16} strokeWidth={1.8} /> Genel Durum</h3>
      </div>
      <div className="overview-grid">
        {items.map((item) => (
          <div key={item.label} className="overview-item">
            <div className="overview-header">
              <span className="overview-label">{item.label}</span>
              <span className="overview-value">{item.current}/{item.total}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(item.current / item.total) * 100}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
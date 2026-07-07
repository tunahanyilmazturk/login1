import { useNavigate } from 'react-router-dom'
import { TrendingUp, Plus, FileText, FileSpreadsheet } from 'lucide-react'

const quickActions = [
  { label: 'Firma Ekle', icon: Plus, color: '#3b82f6', action: 'companies' },
  { label: 'Firmalar', icon: FileText, color: '#8b5cf6', action: 'companies' },
  { label: 'Excel Aktar', icon: FileSpreadsheet, color: '#22c55e', action: 'companies' },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <section className="card quick-card">
      <div className="card-title-row">
        <h3><TrendingUp size={16} strokeWidth={1.8} /> Hızlı İşlemler</h3>
      </div>
      <div className="quick-grid">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              className="quick-item"
              onClick={() => navigate(`/${action.action}`)}
            >
              <span className="quick-icon" style={{ background: `${action.color}14`, color: action.color }}>
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
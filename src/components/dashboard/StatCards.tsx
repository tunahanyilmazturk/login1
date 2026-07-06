import { Users, GraduationCap, ClipboardCheck, BarChart3 } from 'lucide-react'

const stats = [
  { value: '124', label: 'Toplam Personel', icon: Users, change: '+8 bu ay', up: true },
  { value: '18', label: 'Aktif Eğitim', icon: GraduationCap, change: '+3 bu hafta', up: true },
  { value: '7', label: 'Bekleyen Denetim', icon: ClipboardCheck, change: '2\u2019si kritik', up: false },
  { value: '42', label: 'Bu Ayki Rapor', icon: BarChart3, change: '+%12 geçen aya göre', up: true },
]

export default function StatCards() {
  return (
    <div className="stats-grid">
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <article key={s.label} className="stat-card">
            <div className="stat-header">
              <span className="stat-icon" style={{ background: s.up ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', color: s.up ? '#3b82f6' : '#ef4444' }}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</span>
            </div>
            <div className="stat-body">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}
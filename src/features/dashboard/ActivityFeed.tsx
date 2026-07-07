import { useState } from 'react'
import { Activity, Building2, CheckCircle, AlertTriangle } from 'lucide-react'

interface Company {
  id: number; name: string; sector: string
  status: 'active' | 'passive'; createdAt: string
}

function loadCompanies(): Company[] {
  try {
    const raw = localStorage.getItem('hantech_companies')
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const typeConfig: Record<string, { icon: typeof Building2; color: string }> = {
  new: { icon: Building2, color: '#3b82f6' },
  active: { icon: CheckCircle, color: '#10b981' },
  passive: { icon: AlertTriangle, color: '#ef4444' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Bugün'
  if (days === 1) return 'Dün'
  return `${days} gün önce`
}

export default function ActivityFeed() {
  const [companies] = useState<Company[]>(loadCompanies)

  const sorted = [...companies]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return (
    <section className="card activity-card">
      <div className="card-title-row">
        <h3><Activity size={16} strokeWidth={1.8} /> Son Aktiviteler</h3>
      </div>
      {sorted.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          Henüz firma eklenmemiş
        </p>
      ) : (
        <ul className="activity-list">
          {sorted.map((c) => {
            const type = c.status === 'active' ? 'new' : 'passive'
            const { icon: Icon, color } = typeConfig[type]
            return (
              <li key={c.id} className="activity-item">
                <span className="activity-dot" style={{ background: color }} />
                <span className="activity-icon" style={{ background: `${color}14`, color }}>
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <div className="activity-body">
                  <strong>{c.name}</strong>
                  <span>{c.sector} · {c.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </div>
                <time>{timeAgo(c.createdAt)}</time>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
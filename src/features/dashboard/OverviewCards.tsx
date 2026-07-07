import { useState } from 'react'
import { Activity } from 'lucide-react'

interface Company {
  status: 'active' | 'passive'
  employeeCount: number
}

function loadCompanies(): Company[] {
  try {
    const raw = localStorage.getItem('hantech_companies')
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

export default function OverviewCards() {
  const [companies] = useState<Company[]>(loadCompanies)

  const total = companies.length || 1
  const active = companies.filter((c) => c.status === 'active').length
  const passive = companies.filter((c) => c.status === 'passive').length
  const totalEmp = companies.reduce((s, c) => s + c.employeeCount, 0)

  const items = [
    { label: 'Aktif firma oranı', current: active, total, color: colors[0] },
    { label: 'Pasif firma oranı', current: passive, total, color: colors[1] },
    { label: 'Ort. çalışan sayısı', current: totalEmp, total: Math.max(totalEmp, total), color: colors[2] },
  ]

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
              <span className="overview-value">
                {item.label === 'Ort. çalışan sayısı'
                  ? Math.round(item.current / companies.length || 0)
                  : `${item.current}/${item.total}`
                }
              </span>
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
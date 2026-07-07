import { useState, useEffect } from 'react'
import { Building2, Users, CheckCircle, AlertTriangle } from 'lucide-react'

interface Company {
  id: number; name: string; sector: string; taxNo: string
  phone: string; email: string; notes: string
  status: 'active' | 'passive'; createdAt: string; employeeCount: number
}

function loadCompanies(): Company[] {
  try {
    const raw = localStorage.getItem('hantech_companies')
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const icons = [Building2, Users, CheckCircle, AlertTriangle]
const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']

export default function StatCards() {
  const [companies, setCompanies] = useState<Company[]>(loadCompanies)

  useEffect(() => {
    const handler = () => setCompanies(loadCompanies())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const total = companies.length
  const active = companies.filter((c) => c.status === 'active').length
  const passive = companies.filter((c) => c.status === 'passive').length
  const totalEmployees = companies.reduce((s, c) => s + c.employeeCount, 0)

  const stats = [
    { value: String(total), label: 'Toplam Firma', change: `+${active} aktif`, up: true },
    { value: String(totalEmployees), label: 'Toplam Çalışan', change: `${companies.length} firmada`, up: true },
    { value: String(passive), label: 'Pasif Firma', change: `%${total ? Math.round(passive / total * 100) : 0} oran`, up: false },
    { value: String(active), label: 'Aktif Firma', change: `%${total ? Math.round(active / total * 100) : 0} oran`, up: true },
  ]

  return (
    <div className="stats-grid">
      {stats.map((s, i) => {
        const Icon = icons[i]
        return (
          <article key={s.label} className="stat-card">
            <div className="stat-top">
              <span className="stat-icon-box" style={{ background: `${colors[i]}14`, color: colors[i] }}>
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <span className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</span>
            </div>
            <strong className="stat-value">{s.value}</strong>
            <span className="stat-label">{s.label}</span>
          </article>
        )
      })}
    </div>
  )
}
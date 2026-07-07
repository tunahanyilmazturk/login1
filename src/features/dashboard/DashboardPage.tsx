import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Building2, ArrowRight, User, Phone } from 'lucide-react'
import StatCards from './StatCards'
import ActivityFeed from './ActivityFeed'
import QuickActions from './QuickActions'
import OverviewCards from './OverviewCards'

interface Company {
  id: number; name: string; sector: string
  authorizedPerson: string; phone: string
  status: 'active' | 'passive'; createdAt: string
}

function loadCompanies(): Company[] {
  try {
    const raw = localStorage.getItem('hantech_companies')
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export default function DashboardPage() {
  const [companies] = useState<Company[]>(loadCompanies)
  const navigate = useNavigate()

  const recent = [...companies]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  return (
    <div className="page-content">
      <div className="content-top">
        <div>
          <h2>Genel Bakış</h2>
          <p className="content-subtitle">OSGB operasyonlarına genel bakış</p>
        </div>
        <div className="date-badge">
          <Calendar size={14} strokeWidth={1.8} />
          <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <StatCards />

      <div className="dashboard-panels">
        <ActivityFeed />
        <div className="panels-right">
          <QuickActions />
          <OverviewCards />
        </div>
      </div>

      {recent.length > 0 && (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-title-row">
            <h3><Building2 size={16} strokeWidth={1.8} /> Son Eklenen Firmalar</h3>
            <button className="card-link" onClick={() => navigate('/companies')}>
              Tümü <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Yetkili</th>
                  <th>Telefon</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="company-avatar-sm">{c.name.charAt(0)}</div>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{c.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.sector}</span>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}><User size={13} strokeWidth={1.6} /> {c.authorizedPerson || '—'}</span></td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}><Phone size={13} strokeWidth={1.6} /> {c.phone}</span></td>
                    <td><span className={`status-badge ${c.status}`} style={{ cursor: 'default' }}>{c.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.createdAt}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
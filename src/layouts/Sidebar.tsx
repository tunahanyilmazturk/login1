import { useState } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck,
  FileText, BarChart3, Settings, ChevronDown, LogOut,
  Moon, Sun,
} from 'lucide-react'

interface SubItem { id: string; label: string }
interface MenuItem { id: string; label: string; icon: typeof LayoutDashboard; badge?: string; sub?: SubItem[] }

const menuSections: { heading: string; items: MenuItem[] }[] = [
  {
    heading: 'Ana Menü',
    items: [{ id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard }],
  },
  {
    heading: 'Yönetim',
    items: [
      { id: 'personnel', label: 'Personel Yönetimi', icon: Users, badge: '124' },
      {
        id: 'training', label: 'Eğitim Takibi', icon: GraduationCap,
        sub: [
          { id: 'training-active', label: 'Aktif Eğitimler' },
          { id: 'training-planned', label: 'Planlananlar' },
          { id: 'training-cert', label: 'Sertifikalar' },
        ],
      },
      { id: 'inspection', label: 'Denetim Raporları', icon: ClipboardCheck, badge: '7' },
    ],
  },
  {
    heading: 'Döküman & Rapor',
    items: [
      { id: 'documents', label: 'Evrak Yönetimi', icon: FileText },
      { id: 'reports', label: 'Raporlar', icon: BarChart3 },
    ],
  },
  {
    heading: 'Sistem',
    items: [{ id: 'settings', label: 'Ayarlar', icon: Settings }],
  },
]

export default function Sidebar({
  active,
  onSelect,
  theme,
  toggleTheme,
}: {
  active: string
  onSelect: (id: string) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ training: true })

  function toggleSub(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-wrap">
          <span className="sidebar-logo">H</span>
        </div>
        <div className="sidebar-brand-wrap">
          <span className="sidebar-brand">HanTech</span>
          <span className="sidebar-version">OSGB v2.0</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section) => (
          <div key={section.heading} className="sidebar-section">
            <span className="sidebar-heading">{section.heading}</span>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id || item.sub?.some((s) => s.id === active)
              const isOpen = expanded[item.id]

              return (
                <div key={item.id} className="sidebar-menu-group">
                  <button
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (item.sub) { toggleSub(item.id); onSelect(item.sub[0].id) }
                      else onSelect(item.id)
                    }}
                  >
                    <span className="sidebar-item-icon"><Icon size={18} strokeWidth={1.6} /></span>
                    <span className="sidebar-item-label">{item.label}</span>
                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    {item.sub && (
                      <ChevronDown size={14} className={`sidebar-chevron ${isOpen ? 'open' : ''}`} strokeWidth={2} />
                    )}
                  </button>

                  {item.sub && isOpen && (
                    <div className="sidebar-sub">
                      {item.sub.map((sub) => (
                        <button
                          key={sub.id}
                          className={`sidebar-sub-item ${active === sub.id ? 'active' : ''}`}
                          onClick={() => onSelect(sub.id)}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">TA</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Tunahan</span>
            <span className="sidebar-user-role">Yönetici</span>
          </div>
        </div>
        <div className="sidebar-footer-actions">
          <button className="sidebar-footer-btn" onClick={toggleTheme} title="Temayı değiştir">
            {theme === 'light' ? <Moon size={15} strokeWidth={1.6} /> : <Sun size={15} strokeWidth={1.6} />}
          </button>
          <button className="sidebar-footer-btn" title="Çıkış">
            <LogOut size={15} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </aside>
  )
}
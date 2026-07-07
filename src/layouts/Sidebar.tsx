import { useState, useCallback } from 'react'
import {
  LayoutDashboard, Building2, Users, FlaskConical, Monitor, Truck, FileText, Stethoscope, ChevronDown, LogOut,
  Moon, Sun,
} from 'lucide-react'

interface SubItem { id: string; label: string }
interface MenuItem {
  id: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string
  sub?: SubItem[]
}

const menuSections: { heading: string; items: MenuItem[] }[] = [
  {
    heading: 'Ana Menü',
    items: [
      { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
      { id: 'companies', label: 'Firmalar', icon: Building2, badge: '12' },
      { id: 'personnel', label: 'Personeller', icon: Users },
      { id: 'tests', label: 'Testler', icon: FlaskConical },
      { id: 'equipment', label: 'Ekipmanlar', icon: Monitor },
      { id: 'vehicles', label: 'Mobil Araçlar', icon: Truck },
      { id: 'quotes', label: 'Teklifler', icon: FileText, badge: '6' },
      { id: 'scans', label: 'Taramalar', icon: Stethoscope, badge: '6' },
    ],
  },
]

function isItemActive(item: MenuItem, activeId: string): boolean {
  return activeId === item.id || item.sub?.some((s) => s.id === activeId) || false
}

export default function Sidebar({
  active, onSelect, collapsed, theme, toggleTheme, onLogout,
}: {
  active: string
  onSelect: (id: string) => void
  collapsed: boolean
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onLogout?: () => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleSelect = useCallback((id: string) => {
    onSelect(id)
  }, [onSelect])

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.sub) {
      setExpanded((prev) => {
        const isOpen = !prev[item.id]
        if (isOpen) onSelect(item.sub![0].id)
        return { ...prev, [item.id]: isOpen }
      })
    } else {
      onSelect(item.id)
    }
  }, [onSelect])

  const setHovered = useCallback((id: string | null) => {
    setHoveredItem(id)
  }, [])

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-wrap">
          {collapsed ? (
            <span className="sidebar-logo">H</span>
          ) : (
            <>
              <span className="sidebar-logo">H</span>
              <div className="sidebar-brand-wrap">
                <span className="sidebar-brand">HanTech</span>
                <span className="sidebar-version">OSGB v2.0</span>
              </div>
            </>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section) => (
          <div key={section.heading} className="sidebar-section">
            {!collapsed && (
              <span className="sidebar-heading">{section.heading}</span>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item, active)
              const isOpen = expanded[item.id]
              const isHovered = hoveredItem === item.id

              return (
                <div key={item.id} className="sidebar-menu-group">
                  <button
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && <span className="sidebar-active-indicator" />}
                    <span className="sidebar-item-icon"><Icon size={18} strokeWidth={1.6} /></span>
                    {!collapsed && (
                      <>
                        <span className="sidebar-item-label">{item.label}</span>
                        {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                        {item.sub && (
                          <ChevronDown size={14} className={`sidebar-chevron ${isOpen ? 'open' : ''}`} strokeWidth={2} />
                        )}
                      </>
                    )}
                    {collapsed && item.badge && <span className="sidebar-badge collapsed-badge">{item.badge}</span>}
                    {collapsed && item.sub && <span className="sidebar-sub-dot" />}
                  </button>

                  {collapsed && isHovered && (
                    <div className="sidebar-tooltip">
                      <strong>{item.label}</strong>
                      {item.sub?.map((s) => (
                        <button
                          key={s.id}
                          className={`sidebar-tooltip-sub ${active === s.id ? 'active' : ''}`}
                          onClick={() => handleSelect(s.id)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {!collapsed && item.sub && (
                    <div className={`sidebar-sub-wrap ${isOpen ? 'open' : ''}`}>
                      <div className="sidebar-sub">
                        {item.sub.map((sub) => (
                          <button
                            key={sub.id}
                            className={`sidebar-sub-item ${active === sub.id ? 'active' : ''}`}
                            onClick={() => handleSelect(sub.id)}
                          >
                            {active === sub.id && <span className="sidebar-sub-indicator" />}
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`sidebar-user-card ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-user-avatar-wrap">
            <div className="sidebar-user-avatar">TA</div>
            <span className="sidebar-user-status" />
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Tunahan</span>
              <span className="sidebar-user-role">Yönetici</span>
            </div>
          )}
        </div>
        <div className={`sidebar-footer-actions ${collapsed ? 'collapsed' : ''}`}>
          <button className="sidebar-footer-btn" onClick={toggleTheme} title="Temayı değiştir">
            {theme === 'light' ? <Moon size={15} strokeWidth={1.6} /> : <Sun size={15} strokeWidth={1.6} />}
          </button>
          <button className="sidebar-footer-btn" onClick={onLogout} title="Çıkış">
            <LogOut size={15} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {collapsed && (
        <div className="sidebar-version-badge">v2.0</div>
      )}
    </aside>
  )
}
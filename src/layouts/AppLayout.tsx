import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useTheme } from '../app/ThemeContext'

export default function AppLayout({ onLogout, children }: { onLogout: () => void; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('hantech_sidebar') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const active = location.pathname.replace('/', '') || 'dashboard'

  function handleNavigate(id: string) {
    navigate(`/${id}`)
    handleCloseMobile()
  }

  function handleToggleMenu() {
    if (window.innerWidth <= 768) {
      setMobileOpen((v) => !v)
    } else {
      setCollapsed((v) => {
        const next = !v
        localStorage.setItem('hantech_sidebar', String(next))
        return next
      })
    }
  }

  function handleCloseMobile() {
    setMobileOpen(false)
  }

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>
      <Sidebar active={active} onSelect={handleNavigate} collapsed={collapsed} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} />
      <div className="app-main">
        <Topbar theme={theme} toggleTheme={toggleTheme} collapsed={collapsed} onToggleCollapse={handleToggleMenu} onLogout={onLogout} active={active} />
        <main className="app-content">{children}</main>
      </div>
      {mobileOpen && <div className="overlay" onClick={handleCloseMobile} />}
    </div>
  )
}
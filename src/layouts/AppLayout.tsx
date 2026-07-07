import { useState, useCallback, useMemo, type ReactNode } from 'react'
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

  const active = useMemo(() => (location.pathname.replace('/', '') || 'dashboard').split('/')[0], [location.pathname])

  const handleNavigate = useCallback((id: string) => {
    navigate(`/${id}`)
    setMobileOpen(false)
  }, [navigate])

  const handleToggleMenu = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen((v) => !v)
    } else {
      setCollapsed((v) => {
        const next = !v
        localStorage.setItem('hantech_sidebar', String(next))
        return next
      })
    }
  }, [])

  const handleCloseMobile = useCallback(() => setMobileOpen(false), [])

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
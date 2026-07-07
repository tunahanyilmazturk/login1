import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Bell, Search, Sun, Moon, ChevronDown, PanelLeftClose, PanelLeft, X,
  Maximize2, Minimize2, User, Settings, LogOut, HelpCircle,
  CheckCircle, AlertTriangle, Info, Calendar,
} from 'lucide-react'

interface Notification {
  id: number
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'info'
  read: boolean
}

const notifications: Notification[] = [
  { id: 1, title: 'Eğitim tamamlandı', description: 'Temel İş Sağlığı eğitimi 18 katılımcıyla tamamlandı', time: '2 dk önce', type: 'success', read: false },
  { id: 2, title: 'Denetim bulgusu', description: 'Şantiye A denetiminde 3 kritik bulgu tespit edildi', time: '15 dk önce', type: 'warning', read: false },
  { id: 3, title: 'Evrak süresi doluyor', description: 'Yangın Söndürme Sertifikası 3 gün içinde süresi dolacak', time: '1 saat önce', type: 'warning', read: false },
  { id: 4, title: 'Yeni personel kaydı', description: 'Ahmet Yılmaz sisteme eklendi', time: '2 saat önce', type: 'info', read: true },
  { id: 5, title: 'Rapor hazırlandı', description: 'Aylık OSGB raporu oluşturuldu', time: '3 saat önce', type: 'success', read: true },
]

const notificationIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const notificationColors = {
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
}

const pageLabels: Record<string, string> = {
  dashboard: 'Genel Bakış',
  companies: 'Firmalar',
  personnel: 'Personeller',
  tests: 'Testler',
  equipment: 'Ekipmanlar',
  vehicles: 'Mobil Araçlar',
  quotes: 'Teklifler',
  scans: 'Taramalar',
}

export default function Topbar({
  theme, toggleTheme, collapsed, onToggleCollapse, onLogout, active,
}: {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  onLogout?: () => void
  active?: string
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleFSChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchValue('')
    searchRef.current?.focus()
  }, [])

  const activeLabel = active ? pageLabels[active] || '' : ''

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}>
          {collapsed ? <PanelLeft size={18} strokeWidth={1.6} /> : <PanelLeftClose size={18} strokeWidth={1.6} />}
        </button>

        <nav className="topbar-breadcrumb">
          <span className="breadcrumb-item">OSGB</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item active">{activeLabel}</span>
        </nav>
      </div>

      <div className="topbar-center">
        <div className={`topbar-search ${searchOpen || searchValue ? 'expanded' : ''}`}>
          <Search size={16} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Ara... (Ctrl + /)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => { if (!searchValue) setSearchOpen(false) }}
          />
          {searchValue && (
            <button className="topbar-search-clear" onClick={clearSearch}>
              <X size={14} strokeWidth={1.6} />
            </button>
          )}
          <kbd>/</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}>
          {isFullscreen ? <Minimize2 size={17} strokeWidth={1.6} /> : <Maximize2 size={17} strokeWidth={1.6} />}
        </button>

        <div className="topbar-notif-wrap" ref={notifRef}>
          <button className="topbar-icon-btn" onClick={() => setNotifOpen((v) => !v)} title="Bildirimler">
            <Bell size={18} strokeWidth={1.6} />
            {unreadCount > 0 && <span className="topbar-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="topbar-dropdown notif-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-title">Bildirimler</span>
                <button className="dropdown-mark-read">Tümünü okundu işaretle</button>
              </div>
              <div className="notif-list">
                {notifications.map((n) => {
                  const Icon = notificationIcons[n.type]
                  const color = notificationColors[n.type]
                  return (
                    <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`}>
                      <span className="notif-icon" style={{ background: `${color}14`, color }}>
                        <Icon size={14} strokeWidth={1.8} />
                      </span>
                      <div className="notif-body">
                        <strong>{n.title}</strong>
                        <span>{n.description}</span>
                      </div>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  )
                })}
              </div>
              <div className="dropdown-footer">
                <button className="dropdown-footer-btn">Tüm bildirimleri gör</button>
              </div>
            </div>
          )}
        </div>

        <button className="topbar-icon-btn" onClick={toggleTheme} title="Temayı değiştir">
          {theme === 'light' ? <Moon size={17} strokeWidth={1.6} /> : <Sun size={17} strokeWidth={1.6} />}
        </button>

        <div className="topbar-user-wrap" ref={userRef}>
          <button className="topbar-user" onClick={() => setUserMenuOpen((v) => !v)}>
            <div className="topbar-avatar">TA</div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">Tunahan</span>
              <span className="topbar-user-role">Yönetici</span>
            </div>
            <ChevronDown size={14} strokeWidth={2} className={`topbar-chevron ${userMenuOpen ? 'open' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="topbar-dropdown user-dropdown">
              <div className="user-dropdown-header">
                <div className="topbar-avatar large">TA</div>
                <div>
                  <strong>Tunahan</strong>
                  <span>tunahan@hantech.com</span>
                </div>
              </div>
              <div className="dropdown-menu">
                <button className="dropdown-menu-item">
                  <User size={15} strokeWidth={1.6} /> Profil
                </button>
                <button className="dropdown-menu-item">
                  <Settings size={15} strokeWidth={1.6} /> Ayarlar
                </button>
                <button className="dropdown-menu-item">
                  <Calendar size={15} strokeWidth={1.6} /> Takvim
                </button>
                <button className="dropdown-menu-item">
                  <HelpCircle size={15} strokeWidth={1.6} /> Yardım
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-menu-item danger" onClick={onLogout}>
                  <LogOut size={15} strokeWidth={1.6} /> Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
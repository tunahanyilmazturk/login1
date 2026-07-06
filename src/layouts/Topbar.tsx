import { useState } from 'react'
import { Bell, Search, Sun, Moon, ChevronDown } from 'lucide-react'

export default function Topbar({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className={`topbar-search ${searchOpen ? 'expanded' : ''}`}>
          <Search size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Ara..."
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
          <kbd>/</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Bildirimler">
          <Bell size={18} strokeWidth={1.6} />
          <span className="topbar-dot" />
        </button>
        <button className="topbar-icon-btn" onClick={toggleTheme} title="Temayı değiştir">
          {theme === 'light' ? <Moon size={17} strokeWidth={1.6} /> : <Sun size={17} strokeWidth={1.6} />}
        </button>
        <div className="topbar-user">
          <div className="topbar-avatar">TA</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">Tunahan</span>
            <span className="topbar-user-role">Yönetici</span>
          </div>
          <ChevronDown size={14} strokeWidth={2} className="topbar-chevron" />
        </div>
      </div>
    </header>
  )
}
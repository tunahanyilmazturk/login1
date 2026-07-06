import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useTheme } from '../ThemeContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState('dashboard')
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app-layout">
      <Sidebar active={active} onSelect={setActive} theme={theme} toggleTheme={toggleTheme} />
      <div className="app-main">
        <Topbar theme={theme} toggleTheme={toggleTheme} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
import { type FormEvent, useId, useState } from 'react'
import { Moon, Sun, Eye, EyeOff, Loader2, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react'
import { ThemeProvider, useTheme } from './ThemeContext'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import './App.css'

const DEMO_CREDENTIALS = { email: 'demo@hantech.com', password: 'demo1234' }

interface FormErrors { email?: string; password?: string }

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email) errors.email = 'E-posta adresi gerekli'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Geçerli bir e-posta girin'
  if (!password) errors.password = 'Parola gerekli'
  else if (password.length < 6) errors.password = 'En az 6 karakter'
  return errors
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const emailId = useId(); const passwordId = useId()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false); const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({}); const [touched, setTouched] = useState<Record<string, boolean>>({})
  const { theme, toggleTheme } = useTheme()

  function handleBlur(field: string) { setTouched((p) => ({ ...p, [field]: true })); setErrors(validate(email, password)) }
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const errs = validate(email, password)
    setErrors(errs); setTouched({ email: true, password: true })
    if (Object.keys(errs).length > 0) return
    setLoading(true); setTimeout(() => { setLoading(false); onLogin() }, 800)
  }
  function handleDemo() {
    setEmail(DEMO_CREDENTIALS.email); setPassword(DEMO_CREDENTIALS.password)
    setErrors({}); setTouched({ email: true, password: true })
    setLoading(true); setTimeout(() => { setLoading(false); onLogin() }, 800)
  }

  return (
    <div className="root">
      <aside className="brand">
        <div className="brand-bg-pattern" />
        <div className="brand-content">
          <div className="brand-top"><span className="logo">H</span><span className="brand-label">HanTech</span></div>
          <div className="brand-body">
            <p className="brand-eyebrow"><Sparkles size={12} /> OSGB Yönetim Sistemi</p>
            <h1>Operasyonlarınızı <br />tek merkezden yönetin</h1>
            <p className="brand-desc">Saha yönetimi, eğitim takibi ve denetim raporlamayı kurumsal güvenlikle buluşturan modern platform.</p>
            <div className="divider" />
            <ul>
              <li>Saha operasyon yönetimi</li>
              <li>Dijital eğitim takibi</li>
              <li>Denetime hazır raporlama</li>
            </ul>
          </div>
          <footer className="brand-footer"><span>&copy; 2026 HanTech</span></footer>
        </div>
      </aside>
      <main className="login">
        <div className="theme-corner">
          <button className="corner-theme-btn" onClick={toggleTheme} title="Temayı değiştir">
            {theme === 'light' ? <Moon size={13} strokeWidth={1.8} /> : <Sun size={13} strokeWidth={1.8} />}
          </button>
        </div>
        <div className="login-card">
          <div className="card-header">
            <span className="pill"><ShieldCheck size={11} strokeWidth={2.5} /> Güvenli Giriş</span>
            <h2>Hoş geldiniz</h2>
            <p>Kurumsal hesabınızla devam edin</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor={emailId}>E-posta adresi</label>
              <div className={`input-wrap ${errors.email && touched.email ? 'has-error' : ''}`}>
                <Mail size={16} className="input-icon" strokeWidth={1.6} />
                <input id={emailId} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur('email')} placeholder="ornek@hantech.com" />
              </div>
              {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field-group">
              <label htmlFor={passwordId}>Parola</label>
              <div className={`input-wrap ${errors.password && touched.password ? 'has-error' : ''}`}>
                <Lock size={16} className="input-icon" strokeWidth={1.6} />
                <input id={passwordId} type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur('password')} placeholder="••••••••" />
                <button type="button" className="toggle" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Parolayı gizle' : 'Parolayı göster'}>
                  {visible ? <EyeOff size={15} strokeWidth={1.6} /> : <Eye size={15} strokeWidth={1.6} />}
                </button>
              </div>
              {touched.password && errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <div className="row">
              <label className="check"><input type="checkbox" defaultChecked /><span>Beni hatırla</span></label>
              <button type="button" className="link">Şifremi unuttum</button>
            </div>
            <button type="submit" className="submit" disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin" /> Giriş yapılıyor</> : 'Giriş yap'}
            </button>
            <div className="divider-label"><span>veya</span></div>
            <button type="button" className="demo-btn" onClick={handleDemo} disabled={loading}>Demo hesapla hızlı giriş</button>
          </form>
          <p className="support">Kurumsal destek &mdash; <a href="mailto:support@hantech.com">support@hantech.com</a></p>
        </div>
      </main>
    </div>
  )
}

function AppShell() {
  const [loggedIn, setLoggedIn] = useState(false)
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />
  return <div className="app-shell"><AppLayout><DashboardPage /></AppLayout></div>
}

export default function App() {
  return <ThemeProvider><AppShell /></ThemeProvider>
}
import type { Quote, QuoteItem, Company, TestItem, QuoteType } from './types'

export const STORAGE_KEY = 'hantech_quotes'
export const DRAFT_KEY = 'hantech_quote_draft'

export function getCompanies(): Company[] {
  try { const raw = localStorage.getItem('hantech_companies'); if (raw) return JSON.parse(raw) } catch { return [] }
  return []
}

export function getTests(): TestItem[] {
  try {
    const raw = localStorage.getItem('hantech_tests')
    if (raw) return JSON.parse(raw)
    const defaults: TestItem[] = [
      { id: 1, code: 'HEM-001', name: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji', price: 50, status: 'active' },
      { id: 2, code: 'BIY-001', name: 'Açlık Kan Şekeri', category: 'Biyokimya', price: 25, status: 'active' },
      { id: 3, code: 'BIY-003', name: 'Total Kolesterol', category: 'Biyokimya', price: 30, status: 'active' },
      { id: 4, code: 'BIY-004', name: 'HDL - LDL Kolesterol', category: 'Biyokimya', price: 40, status: 'active' },
      { id: 5, code: 'BIY-005', name: 'Trigliserit', category: 'Biyokimya', price: 25, status: 'active' },
      { id: 6, code: 'BIY-006', name: 'ALT (SGPT)', category: 'Biyokimya', price: 20, status: 'active' },
      { id: 7, code: 'BIY-007', name: 'AST (SGOT)', category: 'Biyokimya', price: 20, status: 'active' },
      { id: 8, code: 'BIY-008', name: 'Kreatinin', category: 'Biyokimya', price: 20, status: 'active' },
      { id: 9, code: 'BIY-009', name: 'Üre', category: 'Biyokimya', price: 20, status: 'active' },
      { id: 10, code: 'BIY-010', name: 'Ürik Asit', category: 'Biyokimya', price: 25, status: 'active' },
      { id: 11, code: 'RAD-001', name: 'PA Akciğer Grafisi', category: 'Radyoloji', price: 80, status: 'active' },
      { id: 12, code: 'ODY-001', name: 'Odyometri Testi', category: 'Odyometri', price: 60, status: 'active' },
      { id: 13, code: 'EKG-001', name: 'Elektrokardiyografi', category: 'EKG', price: 55, status: 'active' },
      { id: 14, code: 'SPR-001', name: 'Spirometri (Solunum Fonksiyon)', category: 'Spirometri', price: 65, status: 'active' },
      { id: 15, code: 'GEN-001', name: 'İdrar Tahlili (Tam İdrar)', category: 'Genel Sağlık', price: 30, status: 'active' },
    ]
    localStorage.setItem('hantech_tests', JSON.stringify(defaults))
    return defaults
  } catch { return [] }
}

export function nextQuoteNo(existing: Quote[]): string {
  const max = existing.reduce((max, q) => {
    const num = parseInt(q.quoteNo.replace('TKF-', ''), 10)
    return isNaN(num) ? max : Math.max(max, num)
  }, 0)
  return 'TKF-' + String(max + 1).padStart(4, '0')
}

export function defaultValidUntil(): string {
  const d = new Date(); d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export function generateTitle(type: QuoteType, company: string, date: string): string {
  const label = type === 'ise_giris_muayene' ? 'İşe Giriş Muayene Teklifi' : 'Mobil Sağlık Taraması Teklifi'
  return `${label} - ${company} - ${date}`
}

export function calcLineTotal(item: QuoteItem): number {
  return Math.max(0, item.price * item.quantity - item.discount)
}

export function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    'Biyokimya': '#3b82f6', 'Hematoloji': '#ef4444', 'Mikrobiyoloji': '#8b5cf6',
    'Patoloji': '#a855f7', 'Radyoloji': '#06b6d4', 'Odyometri': '#14b8a6',
    'EKG': '#f59e0b', 'Spirometri': '#f97316', 'Göz Testi': '#22d3ee',
    'İşitme Testi': '#10b981', 'Psikoteknik': '#6366f1',
    'Genel Sağlık': '#65a30d', 'Diyetisyen': '#ec4899', 'Fizyoterapi': '#0ea5e9',
  }
  return colors[cat] || '#64748b'
}

export function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    'İnşaat': '#3b82f6', 'Enerji': '#f59e0b', 'Lojistik': '#8b5cf6',
    'Gıda': '#10b981', 'Tekstil': '#ec4899', 'Madencilik': '#f97316',
    'Turizm': '#14b8a6', 'Kimya': '#ef4444', 'Otomotiv': '#6366f1',
    'Sağlık': '#22d3ee', 'Bilişim': '#06b6d4', 'Savunma': '#1e40af',
    'Tarım': '#65a30d', 'Eğitim': '#a855f7',
  }
  return colors[sector] || '#64748b'
}

export function getEmployeeSize(emp: number): { label: string; color: string } {
  if (emp <= 10) return { label: 'Mikro', color: '#22d3ee' }
  if (emp <= 49) return { label: 'Küçük', color: '#10b981' }
  if (emp <= 249) return { label: 'Orta', color: '#f59e0b' }
  return { label: 'Büyük', color: '#ef4444' }
}
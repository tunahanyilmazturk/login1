export type QuoteType = 'ise_giris_muayene' | 'mobil_saglik_taramasi'

export interface QuoteItem {
  testCode: string; testName: string; category: string; price: number
  quantity: number; discount: number
}


export interface Quote {
  id: number; quoteNo: string; companyName: string
  quoteType: QuoteType; validUntil: string; quoteTitle: string
  items: QuoteItem[]; total: number; notes: string
  status: 'active' | 'passive'; createdAt: string
  discountTL?: number; discountPct?: number; kdvPct?: number
  coverLetter?: string; terms?: string
}

export interface CoverTemplate {
  id: string; label: string; text(company: string, quoteType: QuoteType, title: string): string
}

export interface TermsTemplate {
  id: string; label: string; text: string
}

export interface Company {
  id: number; name: string; sector: string; authorizedPerson: string
  phone: string; email: string; status: string; employeeCount: number; taxNo?: string
}

export interface TestItem {
  id: number; code: string; name: string; category: string; price: number; status: string
}

export const QUOTE_TYPES: { value: QuoteType; label: string; desc: string }[] = [
  { value: 'ise_giris_muayene', label: 'İşe Giriş Muayene', desc: 'Yeni işe alımlar için sağlık muayene teklifi' },
  { value: 'mobil_saglik_taramasi', label: 'Mobil Sağlık Taraması', desc: 'Saha tarama ve periyodik sağlık teklifi' },
]

export const STEPS = [
  { id: 'company', label: 'Firma Seçimi' },
  { id: 'tests', label: 'Test Seçimi' },
  { id: 'cover', label: 'Ön Yazı' },
  { id: 'terms', label: 'Şartlar & Koşullar' },
  { id: 'summary', label: 'Özet & Onay' },
]

export const CATEGORY_COLORS: Record<string, string> = {
  'Biyokimya': '#3b82f6', 'Hematoloji': '#ef4444', 'Mikrobiyoloji': '#8b5cf6',
  'Patoloji': '#a855f7', 'Radyoloji': '#06b6d4', 'Odyometri': '#14b8a6',
  'EKG': '#f59e0b', 'Spirometri': '#f97316', 'Göz Testi': '#22d3ee',
  'İşitme Testi': '#10b981', 'Psikoteknik': '#6366f1',
  'Genel Sağlık': '#65a30d', 'Diyetisyen': '#ec4899', 'Fizyoterapi': '#0ea5e9',
}

export const SECTOR_COLORS: Record<string, string> = {
  'İnşaat': '#3b82f6', 'Enerji': '#f59e0b', 'Lojistik': '#8b5cf6',
  'Gıda': '#10b981', 'Tekstil': '#ec4899', 'Madencilik': '#f97316',
  'Turizm': '#14b8a6', 'Kimya': '#ef4444', 'Otomotiv': '#6366f1',
  'Sağlık': '#22d3ee', 'Bilişim': '#06b6d4', 'Savunma': '#1e40af',
  'Tarım': '#65a30d', 'Eğitim': '#a855f7',
}
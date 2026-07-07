import { useMemo } from 'react'
import {
  Building2, Check, CalendarDays, PencilLine, FileText, Search, X,
  ArrowDownUp, Clock, User, Phone, Mail, Sparkles,
} from 'lucide-react'
import type { Company, QuoteType } from './types'
import { QUOTE_TYPES } from './types'
import { generateTitle, getSectorColor, getEmployeeSize } from './helpers'
import CompanyCard from './CompanyCard'

interface Props {
  quoteType: QuoteType | null
  validUntil: string
  quoteTitle: string
  selectedCompany: Company | null
  companySearch: string
  sectorFilter: string
  companySort: 'name' | 'count' | 'sector'
  companies: Company[]
  recentCompanyNames: Set<string>
  onSelectType: (t: QuoteType) => void
  onValidUntilChange: (v: string) => void
  onTitleChange: (v: string) => void
  onSelectCompany: (c: Company) => void
  onSearchChange: (v: string) => void
  onClearSearch: () => void
  onSectorFilter: (s: string) => void
  onSortChange: (s: 'name' | 'count' | 'sector') => void
}

export default function CompanyStep({
  quoteType, validUntil, quoteTitle, selectedCompany,
  companySearch, sectorFilter, companySort,
  companies, recentCompanyNames,
  onSelectType, onValidUntilChange, onTitleChange, onSelectCompany,
  onSearchChange, onClearSearch, onSectorFilter, onSortChange,
}: Props) {
  const uniqueSectors = useMemo(
    () => [...new Set(companies.map((c) => c.sector))].sort(),
    [companies],
  )

  const computedTitle = useMemo(() => {
    if (quoteType && selectedCompany) {
      return generateTitle(quoteType, selectedCompany.name, validUntil)
    }
    return ''
  }, [quoteType, selectedCompany, validUntil])

  const filteredCompanies = useMemo(() => {
    const filtered = companies.filter((c) => {
      if (sectorFilter && c.sector !== sectorFilter) return false
      if (!companySearch) return true
      const q = companySearch.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.authorizedPerson?.toLowerCase().includes(q) || c.phone?.includes(q) || (c.taxNo && c.taxNo.includes(q))
    })
    const sorted = [...filtered].sort((a, b) => {
      if (companySort === 'count') return b.employeeCount - a.employeeCount
      if (companySort === 'sector') return a.sector.localeCompare(b.sector)
      return a.name.localeCompare(b.name)
    })
    const recent: Company[] = []
    const other: Company[] = []
    for (const c of sorted) {
      if (recentCompanyNames.has(c.name)) recent.push(c)
      else other.push(c)
    }
    return { recent, other }
  }, [companies, companySearch, sectorFilter, companySort, recentCompanyNames])

  return (
    <div className="wizard-panel">
      <div className="wizard-panel-header">
        <h3><Building2 size={18} strokeWidth={1.8} /> Firma Seçimi</h3>
        <p>Teklif türünü belirleyin ve firmayı seçin</p>
      </div>

      <div className="wizard-two-col">
        {/* ── SOL: Teklif Türü & Bilgileri ── */}
        <div className="wizard-left-card">
          <div className="wizard-left-card-title">
            <FileText size={14} strokeWidth={1.8} />
            <span>Teklif Türü & Bilgileri</span>
          </div>

          <div className="wizard-type-list">
            {QUOTE_TYPES.map((qt) => {
              const active = quoteType === qt.value
              return (
                <button
                  key={qt.value}
                  className={`wizard-type-option ${active ? 'active' : ''}`}
                  onClick={() => onSelectType(qt.value)}
                >
                  <div className="wizard-type-option-left">
                    <div className={`wizard-type-option-icon ${active ? 'active-icon' : ''}`}>
                      <Building2 size={20} strokeWidth={1.6} />
                    </div>
                    <div className="wizard-type-option-text">
                      <strong>{qt.label}</strong>
                      <span>{qt.desc}</span>
                    </div>
                  </div>
                  {active && (
                    <span className="wizard-type-option-check">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="wizard-left-fields">
            <div className="wizard-left-field">
              <label className="wizard-left-label">
                <CalendarDays size={12} strokeWidth={1.6} /> Geçerlilik Tarihi
              </label>
              <input type="date" className="form-input" value={validUntil}
                onChange={(e) => onValidUntilChange(e.target.value)} />
            </div>
            <div className="wizard-left-field">
              <label className="wizard-left-label">
                <PencilLine size={12} strokeWidth={1.6} /> Teklif Başlığı
              </label>
              <input type="text" className="form-input" value={quoteTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={computedTitle || 'Otomatik oluşturulacak...'} />
            </div>
          </div>

          {selectedCompany && quoteType && (
            <div className="wizard-left-preview">
              <Sparkles size={12} strokeWidth={1.6} />
              <span>{computedTitle}</span>
            </div>
          )}
        </div>

        {/* ── SAĞ: Firma Listesi ── */}
        <div className="wizard-right-card">
          <div className="wizard-right-card-title">
            <Building2 size={14} strokeWidth={1.8} />
            <span>Firma Listesi</span>
          </div>

          <div className="wizard-right-toolbar">
            <div className="wizard-right-search">
              <Search size={14} strokeWidth={1.6} />
              <input type="text" placeholder="Firma adı, yetkili, telefon ile ara..."
                value={companySearch} onChange={(e) => onSearchChange(e.target.value)} />
              {companySearch && <button className="table-search-clear" onClick={onClearSearch}><X size={14} strokeWidth={1.6} /></button>}
            </div>
            <div className="wizard-right-filter-row">
              <div className="wizard-right-chips">
                <button className={`wizard-filter-chip ${sectorFilter === '' ? 'active' : ''}`}
                  onClick={() => onSectorFilter('')}>Tümü</button>
                {uniqueSectors.map((s) => (
                  <button key={s} className={`wizard-filter-chip ${sectorFilter === s ? 'active' : ''}`}
                    onClick={() => onSectorFilter(s)}>{s}</button>
                ))}
              </div>
              <div className="wizard-right-sort">
                <ArrowDownUp size={11} strokeWidth={1.6} />
                <select value={companySort} onChange={(e) => onSortChange(e.target.value as 'name' | 'count' | 'sector')}
                  className="wizard-right-sort-select">
                  <option value="name">Ad</option>
                  <option value="count">Çalışan</option>
                  <option value="sector">Sektör</option>
                </select>
              </div>
            </div>
          </div>

          {selectedCompany && (
            <div className="wizard-right-selected">
              <div className="wizard-right-selected-avatar"
                style={{ background: getSectorColor(selectedCompany.sector) + '18', color: getSectorColor(selectedCompany.sector) }}>
                {selectedCompany.name.charAt(0)}
              </div>
              <div className="wizard-right-selected-body">
                <div className="wizard-right-selected-top">
                  <strong>{selectedCompany.name}</strong>
                  <span className="wizard-right-selected-badge">
                    <Check size={9} strokeWidth={3} /> Seçili
                  </span>
                </div>
                <div className="wizard-right-selected-tags">
                  <span style={{ background: getSectorColor(selectedCompany.sector) + '15', color: getSectorColor(selectedCompany.sector) }}>
                    {selectedCompany.sector}
                  </span>
                  <span style={{ background: getEmployeeSize(selectedCompany.employeeCount).color + '15', color: getEmployeeSize(selectedCompany.employeeCount).color }}>
                    {getEmployeeSize(selectedCompany.employeeCount).label}
                  </span>
                  <span>{selectedCompany.employeeCount} çalışan</span>
                </div>
                <div className="wizard-right-selected-details">
                  {selectedCompany.authorizedPerson && <span><User size={10} strokeWidth={1.6} /> {selectedCompany.authorizedPerson}</span>}
                  {selectedCompany.phone && <span><Phone size={10} strokeWidth={1.6} /> {selectedCompany.phone}</span>}
                  {selectedCompany.email && <span><Mail size={10} strokeWidth={1.6} /> {selectedCompany.email}</span>}
                  {selectedCompany.taxNo && <span>Vergi No: {selectedCompany.taxNo}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="wizard-right-list">
            {filteredCompanies.recent.length === 0 && filteredCompanies.other.length === 0 ? (
              <div className="table-empty"><Building2 size={24} strokeWidth={1.4} /><span>Firma bulunamadı</span></div>
            ) : (
              <>
                {filteredCompanies.recent.length > 0 && (
                  <div className="wizard-right-section">
                    <div className="wizard-right-section-label">
                      <Clock size={10} strokeWidth={1.6} /> Son Kullanılanlar
                    </div>
                    {filteredCompanies.recent.map((c) => (
                      <CompanyCard key={c.id} company={c} selected={selectedCompany?.id === c.id} onSelect={onSelectCompany} />
                    ))}
                  </div>
                )}
                {filteredCompanies.other.length > 0 && (
                  <div className="wizard-right-section">
                    <div className="wizard-right-section-label">Diğer Firmalar</div>
                    {filteredCompanies.other.map((c) => (
                      <CompanyCard key={c.id} company={c} selected={selectedCompany?.id === c.id} onSelect={onSelectCompany} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
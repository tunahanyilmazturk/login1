import { User, Phone, Check } from 'lucide-react'
import type { Company } from './types'
import { getSectorColor, getEmployeeSize } from './helpers'

export default function CompanyCard({ company, selected, onSelect }: {
  company: Company; selected?: boolean; onSelect: (c: Company) => void
}) {
  const size = getEmployeeSize(company.employeeCount)
  const sc = getSectorColor(company.sector)
  return (
    <button
      className={`wizard-company-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(company)}
    >
      <div className="company-avatar-sm" style={{ background: sc + '20', color: sc }}>
        {company.name.charAt(0)}
      </div>
      <div className="wizard-company-info">
        <strong>{company.name}</strong>
        <div className="wizard-company-tags">
          <span className="sector-badge" style={{ background: sc + '18', color: sc, fontSize: '0.7rem' }}>
            {company.sector}
          </span>
          <span className="wizard-size-badge" style={{ background: size.color + '18', color: size.color }}>
            {size.label}
          </span>
        </div>
      </div>
      <div className="wizard-company-meta">
        {company.authorizedPerson && <span><User size={11} strokeWidth={1.6} /> {company.authorizedPerson}</span>}
        {company.phone && <span><Phone size={11} strokeWidth={1.6} /> {company.phone}</span>}
      </div>
      {selected && <span className="wizard-check-badge"><Check size={16} strokeWidth={2.5} /></span>}
    </button>
  )
}
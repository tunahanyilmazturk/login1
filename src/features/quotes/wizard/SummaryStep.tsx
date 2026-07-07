import { useMemo } from 'react'
import { Building2, FileText, FlaskConical, User, Phone, TrendingDown, Receipt, CalendarDays, Tag, Hash } from 'lucide-react'
import type { QuoteItem, Company, QuoteType, Quote } from './types'
import { calcLineTotal, nextQuoteNo, getSectorColor } from './helpers'

interface Props {
  quoteTitle: string
  quoteType: QuoteType | null
  validUntil: string
  selectedCompany: Company | null
  items: QuoteItem[]
  itemsSubtotal: number
  itemsDiscountTotal: number
  subtotalAfterItems: number
  summaryDiscountMode: 'tl' | 'pct'
  summaryDiscountTL: number
  summaryDiscountPct: number
  summaryKdvPct: number
  summaryKdvAmount: number
  grandTotal: number
  coverLetter: string
  terms: string
  notes: string
  quotes: Quote[]
  onNotesChange: (v: string) => void
}

export default function SummaryStep({
  quoteTitle, quoteType, validUntil, selectedCompany,
  items, itemsSubtotal, itemsDiscountTotal, subtotalAfterItems,
  summaryDiscountMode, summaryDiscountTL, summaryDiscountPct, summaryKdvPct, summaryKdvAmount, grandTotal,
  coverLetter, terms, notes, quotes, onNotesChange,
}: Props) {
  const summaryDiscountAmount = useMemo(() => {
    if (summaryDiscountMode === 'pct' && subtotalAfterItems > 0) {
      return subtotalAfterItems * summaryDiscountPct / 100
    }
    return summaryDiscountTL
  }, [summaryDiscountMode, summaryDiscountPct, summaryDiscountTL, subtotalAfterItems])

  const quoteNo = useMemo(() => nextQuoteNo(quotes.length > 0 ? quotes : []), [quotes])

  return (
    <div className="wizard-panel">
      <div className="wizard-panel-header">
        <h3><FileText size={18} strokeWidth={1.8} /> Özet & Onay</h3>
        <p>Teklif detaylarını gözden geçirin ve kaydedin</p>
      </div>

      <div className="wizard-summary">
        {/* ── Üst: Bilgi Kartları ── */}
        <div className="wizard-summary-top-row">
          <div className="wizard-summary-info-card">
            <div className="wizard-summary-info-card-title">
              <FileText size={14} strokeWidth={1.8} /> Teklif Bilgileri
            </div>
            <div className="wizard-summary-info-grid">
              <div className="wizard-summary-info-item">
                <span className="wizard-summary-info-label"><Tag size={12} strokeWidth={1.6} /> Başlık</span>
                <strong>{quoteTitle}</strong>
              </div>
              <div className="wizard-summary-info-item">
                <span className="wizard-summary-info-label"><FlaskConical size={12} strokeWidth={1.6} /> Tür</span>
                <strong>{quoteType === 'ise_giris_muayene' ? 'İşe Giriş Muayene' : 'Mobil Sağlık Taraması'}</strong>
              </div>
              <div className="wizard-summary-info-item">
                <span className="wizard-summary-info-label"><CalendarDays size={12} strokeWidth={1.6} /> Geçerlilik</span>
                <strong>{validUntil}</strong>
              </div>
              <div className="wizard-summary-info-item">
                <span className="wizard-summary-info-label"><Hash size={12} strokeWidth={1.6} /> Teklif No</span>
                <strong><code className="test-code">{quoteNo}</code></strong>
              </div>
            </div>
          </div>

          {selectedCompany && (
            <div className="wizard-summary-info-card">
              <div className="wizard-summary-info-card-title">
                <Building2 size={14} strokeWidth={1.8} /> Firma
              </div>
              <div className="wizard-summary-company-row">
                <div className="company-avatar-sm" style={{ background: getSectorColor(selectedCompany.sector) + '20', color: getSectorColor(selectedCompany.sector) }}>
                  {selectedCompany.name.charAt(0)}
                </div>
                <div className="wizard-summary-company-info">
                  <strong>{selectedCompany.name}</strong>
                  <span className="sector-badge" style={{ background: getSectorColor(selectedCompany.sector) + '18', color: getSectorColor(selectedCompany.sector), fontSize: '0.7rem' }}>
                    {selectedCompany.sector}
                  </span>
                  <div className="wizard-summary-meta">
                    {selectedCompany.authorizedPerson && <span><User size={11} strokeWidth={1.6} /> {selectedCompany.authorizedPerson}</span>}
                    {selectedCompany.phone && <span><Phone size={11} strokeWidth={1.6} /> {selectedCompany.phone}</span>}
                    <span><Building2 size={11} strokeWidth={1.6} /> {selectedCompany.employeeCount} çalışan</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Testler Tablosu ── */}
        <div className="wizard-summary-section">
          <h4><FlaskConical size={15} strokeWidth={1.8} /> Testler ({items.length} adet)</h4>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table wizard-summary-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 140 }}>Test Adı</th>
                  <th style={{ width: 80 }}>Birim Fiyat</th>
                  <th style={{ width: 56 }}>Adet</th>
                  <th style={{ width: 72 }}>İndirim</th>
                  <th style={{ width: 90 }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.testName}</td>
                    <td>{item.price.toLocaleString()} TL</td>
                    <td>{item.quantity}</td>
                    <td>{item.discount > 0 ? `${item.discount.toLocaleString()} TL` : '\u2014'}</td>
                    <td><span className="cell-number">{calcLineTotal(item).toLocaleString()} TL</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Fiyat Özeti Kartı ── */}
        <div className="wizard-summary-price-card">
          <div className="wizard-summary-price-title">Fiyat Özeti</div>
          <div className="wizard-summary-price-body">
            <div className="wizard-summary-price-row">
              <span>Ara Toplam</span>
              <span>{itemsSubtotal.toLocaleString()} TL</span>
            </div>
            {itemsDiscountTotal > 0 && (
              <div className="wizard-summary-price-row wizard-summary-price-negative">
                <span>Test İndirimi</span>
                <span>-{itemsDiscountTotal.toLocaleString()} TL</span>
              </div>
            )}
            <div className="wizard-summary-price-row wizard-summary-price-sub">
              <span>İndirim Sonrası</span>
              <span>{subtotalAfterItems.toLocaleString()} TL</span>
            </div>

            <div className="wizard-summary-price-divider" />

            <div className="wizard-summary-price-row">
              <span className="wizard-summary-price-row-label">
                <TrendingDown size={13} strokeWidth={1.6} /> Genel İndirim
              </span>
              <span className="wizard-summary-price-muted">
                {summaryDiscountMode === 'pct' ? `%${summaryDiscountPct}` : `${summaryDiscountTL.toLocaleString()} TL`}
              </span>
            </div>
            {summaryDiscountAmount > 0 && (
              <div className="wizard-summary-price-row wizard-summary-price-negative">
                <span />
                <span>-{summaryDiscountAmount.toLocaleString()} TL</span>
              </div>
            )}

            <div className="wizard-summary-price-row">
              <span className="wizard-summary-price-row-label">
                <Receipt size={13} strokeWidth={1.6} /> KDV
              </span>
              <span className="wizard-summary-price-muted">%{summaryKdvPct}</span>
            </div>
            {summaryKdvAmount > 0 && (
              <div className="wizard-summary-price-row wizard-summary-price-positive">
                <span />
                <span>+{summaryKdvAmount.toLocaleString()} TL</span>
              </div>
            )}

            <div className="wizard-summary-price-divider" />

            <div className="wizard-summary-price-row wizard-summary-price-grand">
              <span>Genel Toplam</span>
              <span>{grandTotal.toLocaleString()} TL</span>
            </div>
          </div>
        </div>

        {/* ── Ön Yazı + Şartlar (yan yana) ── */}
        {(coverLetter || terms) && (
          <div className="wizard-summary-docs-row">
            {coverLetter && (
              <div className="wizard-summary-doc-card">
                <div className="wizard-summary-doc-card-title">
                  <FileText size={13} strokeWidth={1.8} /> Ön Yazı
                </div>
                <div className="wizard-summary-cover wizard-summary-doc-body">
                  {coverLetter.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>
            )}
            {terms && (
              <div className="wizard-summary-doc-card">
                <div className="wizard-summary-doc-card-title">
                  <FileText size={13} strokeWidth={1.8} /> Şartlar & Koşullar
                </div>
                <div className="wizard-summary-cover wizard-summary-doc-body">
                  {terms.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Notlar ── */}
        <div className="wizard-summary-section">
          <h4><FileText size={15} strokeWidth={1.8} /> Notlar</h4>
          <div className="input-wrap textarea-wrap" style={{ width: '100%' }}>
            <FileText size={12} className="input-icon" strokeWidth={1.6} />
            <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Teklif notları (opsiyonel)..." rows={2} />
          </div>
        </div>
      </div>
    </div>
  )
}
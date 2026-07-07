import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Building2, FlaskConical, TrendingDown, Receipt,
  CalendarDays, Tag, Hash, Edit3, Trash2, CheckCircle, XCircle, FileDown,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { ToastBar } from '../../components/ToastBar'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { calcLineTotal } from './wizard/helpers'
import { downloadQuotePdf, openQuotePdf } from './quotePdf'
import type { Quote } from './wizard/types'

const STORAGE_KEY = 'hantech_quotes'

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useLocalStorage<Quote[]>(STORAGE_KEY, [])
  const { toast, showToast } = useToast(3000)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const quote = useMemo(() => {
    const numId = Number(id)
    return quotes.find((q) => q.id === numId) || null
  }, [quotes, id])

  const subtotalAfterItems = useMemo(() => {
    if (!quote) return 0
    return quote.items.reduce((sum, item) => sum + calcLineTotal(item), 0)
  }, [quote])

  const globalDiscountAmount = useMemo(() => {
    if (!quote) return 0
    if (quote.discountPct && quote.discountPct > 0) {
      return subtotalAfterItems * (quote.discountPct / 100)
    }
    return quote.discountTL || 0
  }, [quote, subtotalAfterItems])

  const kdvAmount = useMemo(() => {
    if (!quote) return 0
    return subtotalAfterItems * ((quote.kdvPct || 0) / 100)
  }, [quote, subtotalAfterItems])

  const handleToggleStatus = useCallback(() => {
    if (!quote) return
    const newStatus = quote.status === 'active' ? 'passive' : 'active'
    setQuotes((prev) => prev.map((q) =>
      q.id === quote.id ? { ...q, status: newStatus } : q,
    ))
    showToast('success', `"${quote.quoteNo}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
  }, [quote, setQuotes, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId || !quote) return
    setQuotes((prev) => prev.filter((q) => q.id !== deleteId))
    setDeleteId(null)
    showToast('success', `"${quote.quoteNo}" silindi`)
    navigate('/quotes')
  }, [deleteId, quote, setQuotes, showToast, navigate])

  if (!quote) {
    return (
      <div className="page-content">
        <div className="table-empty" style={{ padding: '60px 20px' }}>
          <FileText size={40} strokeWidth={1.2} />
          <span>Teklif bulunamadı</span>
          <button className="btn btn-ghost" onClick={() => navigate('/quotes')} style={{ marginTop: 12 }}>
            <ArrowLeft size={16} strokeWidth={1.6} /> Tekliflere Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      {/* ── Header ── */}
      <div className="content-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/quotes')} style={{ padding: '6px 10px' }}>
            <ArrowLeft size={16} strokeWidth={1.6} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0 }}>{quote.quoteNo}</h2>
              <span className={`status-badge ${quote.status}`}>{quote.status === 'active' ? 'Aktif' : 'Pasif'}</span>
            </div>
            <p className="content-subtitle" style={{ margin: 0 }}>{quote.quoteTitle}</p>
          </div>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={() => downloadQuotePdf(quote)} style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileDown size={16} strokeWidth={1.6} /> PDF İndir
          </button>
          <button className="btn btn-ghost" onClick={() => openQuotePdf(quote)} style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileText size={16} strokeWidth={1.6} /> PDF Aç
          </button>
          <button className="btn btn-ghost" onClick={() => navigate(`/quotes/new?edit=${quote.id}`)} style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <Edit3 size={16} strokeWidth={1.6} /> Düzenle
          </button>
          <button
            className={`btn ${quote.status === 'active' ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleToggleStatus}
            style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}
          >
            {quote.status === 'active' ? <XCircle size={16} strokeWidth={1.6} /> : <CheckCircle size={16} strokeWidth={1.6} />}
            {quote.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
          </button>
          <button className="btn btn-ghost" onClick={() => setDeleteId(quote.id)} style={{ gap: 8, borderColor: '#ef4444', color: '#ef4444', padding: '8px 18px' }}>
            <Trash2 size={16} strokeWidth={1.6} /> Sil
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="detail-page-grid">
        {/* Sol kolon: bilgiler + dokümanlar */}
        <div className="detail-page-left">
          {/* Teklif Bilgileri */}
          <div className="detail-page-card">
            <div className="detail-page-card-title"><FileText size={14} strokeWidth={1.8} /> Teklif Bilgileri</div>
            <div className="detail-page-card-body">
              <div className="detail-page-info-grid">
                <div className="detail-page-info-item">
                  <span className="detail-page-info-label"><Tag size={12} strokeWidth={1.6} /> Başlık</span>
                  <strong>{quote.quoteTitle}</strong>
                </div>
                <div className="detail-page-info-item">
                  <span className="detail-page-info-label"><FlaskConical size={12} strokeWidth={1.6} /> Tür</span>
                  <strong>{quote.quoteType === 'ise_giris_muayene' ? 'İşe Giriş Muayene' : 'Mobil Sağlık Taraması'}</strong>
                </div>
                <div className="detail-page-info-item">
                  <span className="detail-page-info-label"><CalendarDays size={12} strokeWidth={1.6} /> Geçerlilik</span>
                  <strong>{quote.validUntil || '\u2014'}</strong>
                </div>
                <div className="detail-page-info-item">
                  <span className="detail-page-info-label"><Hash size={12} strokeWidth={1.6} /> Teklif No</span>
                  <strong><code className="test-code">{quote.quoteNo}</code></strong>
                </div>
                <div className="detail-page-info-item">
                  <span className="detail-page-info-label"><CalendarDays size={12} strokeWidth={1.6} /> Oluşturulma</span>
                  <strong>{quote.createdAt}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Firma Bilgileri */}
          <div className="detail-page-card">
            <div className="detail-page-card-title"><Building2 size={14} strokeWidth={1.8} /> Firma</div>
            <div className="detail-page-card-body">
              <div className="detail-page-company-row">
                <div className="company-avatar-sm" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                  {quote.companyName.charAt(0)}
                </div>
                <div>
                  <strong>{quote.companyName}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ön Yazı */}
          {quote.coverLetter && (
            <div className="detail-page-card">
              <div className="detail-page-card-title"><FileText size={14} strokeWidth={1.8} /> Ön Yazı</div>
              <div className="detail-page-card-body detail-page-doc-body">
                {quote.coverLetter.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          )}

          {/* Şartlar & Koşullar */}
          {quote.terms && (
            <div className="detail-page-card">
              <div className="detail-page-card-title"><FileText size={14} strokeWidth={1.8} /> Şartlar & Koşullar</div>
              <div className="detail-page-card-body detail-page-doc-body">
                {quote.terms.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          )}

          {/* Notlar */}
          {quote.notes && (
            <div className="detail-page-card">
              <div className="detail-page-card-title"><FileText size={14} strokeWidth={1.8} /> Notlar</div>
              <div className="detail-page-card-body">
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{quote.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sağ kolon: testler + fiyat özeti */}
        <div className="detail-page-right">
          {/* Testler Tablosu */}
          <div className="detail-page-card">
            <div className="detail-page-card-title">
              <FlaskConical size={14} strokeWidth={1.8} /> Testler ({quote.items.length} adet)
            </div>
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table className="data-table detail-page-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 140 }}>Test Adı</th>
                    <th style={{ width: 80 }}>Birim Fiyat</th>
                    <th style={{ width: 52 }}>Adet</th>
                    <th style={{ width: 72 }}>İndirim</th>
                    <th style={{ width: 90 }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, i) => (
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

          {/* Fiyat Özeti */}
          <div className="detail-page-price-card">
            <div className="wizard-summary-price-title">Fiyat Özeti</div>
            <div className="wizard-summary-price-body">
              {(() => {
                const itemsSubtotal = quote.items.reduce((s, item) => s + item.price * item.quantity, 0)
                const itemsDiscountTotal = quote.items.reduce((s, item) => s + item.discount, 0)
                const itemsTotal = quote.items.reduce((s, item) => s + calcLineTotal(item), 0)
                return (
                  <>
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
                      <span>{itemsTotal.toLocaleString()} TL</span>
                    </div>
                    <div className="wizard-summary-price-divider" />
                    <div className="wizard-summary-price-row">
                      <span className="wizard-summary-price-row-label">
                        <TrendingDown size={13} strokeWidth={1.6} /> Genel İndirim
                      </span>
                      <span className="wizard-summary-price-muted">
                        {quote.discountPct && quote.discountPct > 0
                          ? `%${quote.discountPct}`
                          : quote.discountTL && quote.discountTL > 0
                            ? `${quote.discountTL.toLocaleString()} TL`
                            : 'Yok'}
                      </span>
                    </div>
                    {globalDiscountAmount > 0 && (
                      <div className="wizard-summary-price-row wizard-summary-price-negative">
                        <span />
                        <span>-{globalDiscountAmount.toLocaleString()} TL</span>
                      </div>
                    )}
                    <div className="wizard-summary-price-row">
                      <span className="wizard-summary-price-row-label">
                        <Receipt size={13} strokeWidth={1.6} /> KDV
                      </span>
                      <span className="wizard-summary-price-muted">%{quote.kdvPct || 0}</span>
                    </div>
                    {kdvAmount > 0 && (
                      <div className="wizard-summary-price-row wizard-summary-price-positive">
                        <span />
                        <span>+{kdvAmount.toLocaleString()} TL</span>
                      </div>
                    )}
                    <div className="wizard-summary-price-divider" />
                    <div className="wizard-summary-price-row wizard-summary-price-grand">
                      <span>Genel Toplam</span>
                      <span>{quote.total.toLocaleString()} TL</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Teklifi Sil"
        itemName={quote.quoteNo}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}


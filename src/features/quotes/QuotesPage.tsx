import { useState, useRef, useEffect } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  FileText, Plus, Search, X, Edit3, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  AlertTriangle, DollarSign, Building2, FlaskConical,
  CheckCircle, Check, ArrowUpDown, FileSpreadsheet, Calendar, LayoutList, LayoutGrid,
} from 'lucide-react'

interface QuoteItem {
  testCode: string
  testName: string
  category: string
  price: number
  quantity: number
}

interface Quote {
  id: number
  quoteNo: string
  companyName: string
  items: QuoteItem[]
  total: number
  notes: string
  status: 'active' | 'passive'
  createdAt: string
}

const QUOTES_KEY = 'hantech_quotes'

function loadQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(QUOTES_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function getCompanies(): { name: string }[] {
  try {
    const raw = localStorage.getItem('hantech_companies')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function getTests(): { code: string; name: string; category: string; price: number; status: string }[] {
  try {
    const raw = localStorage.getItem('hantech_tests')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function nextQuoteNo(existing: Quote[]): string {
  const max = existing.reduce((max, q) => {
    const num = parseInt(q.quoteNo.replace('TKF-', ''), 10)
    return isNaN(num) ? max : Math.max(max, num)
  }, 0)
  return 'TKF-' + String(max + 1).padStart(4, '0')
}

type SortField = 'quoteNo' | 'companyName' | 'total' | 'createdAt' | 'status'
type SortDir = 'asc' | 'desc'
type ToastType = 'success' | 'error'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(loadQuotes)
  const [companies] = useState(getCompanies)
  const [availableTests, setAvailableTests] = useState(getTests)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [formCompany, setFormCompany] = useState('')
  const [formItems, setFormItems] = useState<QuoteItem[]>([])
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [selectedTest, setSelectedTest] = useState('')

  useEffect(() => {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes))
  }, [quotes])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    setAvailableTests(getTests())
  }, [])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
  }

  const filtered = quotes
    .filter((q) => {
      if (filterStatus !== 'all' && q.status !== filterStatus) return false
      if (!search) return true
      const qs = search.toLowerCase()
      return (
        q.quoteNo.toLowerCase().includes(qs) ||
        q.companyName.toLowerCase().includes(qs)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'quoteNo') return a.quoteNo.localeCompare(b.quoteNo) * dir
      if (sortField === 'companyName') return a.companyName.localeCompare(b.companyName) * dir
      if (sortField === 'total') return (a.total - b.total) * dir
      if (sortField === 'createdAt') return a.createdAt.localeCompare(b.createdAt) * dir
      return a.status.localeCompare(b.status) * dir
    })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function openAdd() {
    setEditing(null)
    setFormCompany(''); setFormItems([]); setFormNotes(''); setFormStatus('active'); setFormErrors({}); setShowModal(true)
    setAvailableTests(getTests())
  }

  function openEdit(q: Quote) {
    setEditing(q)
    setFormCompany(q.companyName); setFormItems([...q.items]); setFormNotes(q.notes); setFormStatus(q.status); setFormErrors({}); setShowModal(true)
    setAvailableTests(getTests())
  }

  function addTest() {
    if (!selectedTest) return
    const test = availableTests.find((t) => t.code === selectedTest)
    if (!test) return
    setFormItems((prev) => [...prev, { testCode: test.code, testName: test.name, category: test.category, price: test.price, quantity: 1 }])
    setSelectedTest('')
  }

  function removeItem(index: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: 'price' | 'quantity', value: number) {
    setFormItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const formTotal = formItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!formCompany) errors.company = 'Firma seçin'
    if (formItems.length === 0) errors.items = 'En az bir test ekleyin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return
    if (editing) {
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === editing.id
            ? { ...q, companyName: formCompany, items: formItems, total: formTotal, notes: formNotes, status: formStatus }
            : q
        )
      )
      showToast('success', 'Teklif güncellendi')
    } else {
      const newId = Math.max(...quotes.map((q) => q.id), 0) + 1
      setQuotes((prev) => [
        ...prev,
        { id: newId, quoteNo: nextQuoteNo(quotes), companyName: formCompany, items: formItems, total: formTotal, notes: formNotes, status: formStatus, createdAt: new Date().toISOString().slice(0, 10) },
      ])
      showToast('success', 'Teklif oluşturuldu')
    }
    setShowModal(false)
  }

  function handleDelete() {
    if (!deleteId) return
    const name = quotes.find((q) => q.id === deleteId)?.quoteNo
    setQuotes((prev) => prev.filter((q) => q.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', '"' + name + '" silindi')
  }

  function toggleStatus(id: number) {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const newStatus = q.status === 'active' ? 'passive' : 'active'
        showToast('success', '"' + q.quoteNo + '" ' + (newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'))
        return { ...q, status: newStatus as 'active' | 'passive' }
      })
    )
  }

  function exportExcel() {
    exportToExcel(
      quotes as unknown as Record<string, unknown>[],
      [
        { header: 'Teklif No', key: 'quoteNo' },
        { header: 'Firma', key: 'companyName' },
        { header: 'Tutar', key: 'total', transform: (v) => String(v) + ' TL' },
        { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
        { header: 'Tarih', key: 'createdAt' },
      ],
      'teklifler',
    )
    showToast('success', 'Excel dışa aktarıldı')
  }

  function SortArrow({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} strokeWidth={1.6} className="sort-arrow-idle" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} strokeWidth={2} className="sort-arrow" />
      : <ChevronDown size={13} strokeWidth={2} className="sort-arrow" />
  }

  return (
    <div className="page-content">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} strokeWidth={2} /> : <AlertTriangle size={16} strokeWidth={2} />}
          {toast.message}
        </div>
      )}

      <div className="content-top">
        <div>
          <h2>Teklifler</h2>
          <p className="content-subtitle">Firmalara test bazlı fiyat teklifleri oluşturun</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Teklif Oluştur
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Teklif ara (no, firma)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          {search && (
            <button className="table-search-clear" onClick={() => { setSearch(''); searchRef.current?.focus() }}>
              <X size={14} strokeWidth={1.6} />
            </button>
          )}
        </div>
        <div className="table-filters">
          <div className="filter-tabs">
            {(['all', 'active', 'passive'] as const).map((f) => (
              <button
                key={f}
                className={`filter-tab ${filterStatus === f ? 'active' : ''}`}
                onClick={() => { setFilterStatus(f); setPage(1) }}
              >
                {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Tablo görünümü"
            >
              <LayoutList size={15} strokeWidth={1.6} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Kart görünümü"
            >
              <LayoutGrid size={15} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('quoteNo')} className="sortable">
                  Teklif No <SortArrow field="quoteNo" />
                </th>
                <th onClick={() => handleSort('companyName')} className="sortable" style={{ minWidth: 200 }}>
                  Firma <SortArrow field="companyName" />
                </th>
                <th>Test Sayısı</th>
                <th onClick={() => handleSort('total')} className="sortable">
                  Toplam <SortArrow field="total" />
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  Tarih <SortArrow field="createdAt" />
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Durum <SortArrow field="status" />
                </th>
                <th style={{ width: 110 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty">
                      {search || filterStatus !== 'all'
                        ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen teklif bulunamadı</span></>
                        : <><FileText size={24} strokeWidth={1.4} /><span>Henüz teklif oluşturulmamış</span></>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((q) => (
                  <tr key={q.id}>
                    <td><code className="test-code">{q.quoteNo}</code></td>
                    <td><strong>{q.companyName}</strong></td>
                    <td><span className="cell-number">{q.items.length}</span></td>
                    <td><span className="cell-number">{q.total.toLocaleString()} TL</span></td>
                    <td><span className="cell-date"><Calendar size={12} strokeWidth={1.6} /> {q.createdAt}</span></td>
                    <td>
                      <button
                        className={`status-badge ${q.status}`}
                        onClick={() => toggleStatus(q.id)}
                        title="Durumu değiştir"
                      >
                        {q.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="cell-action-btn view" onClick={() => setDetailQuote(q)} title="Detay">
                          <FileText size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn edit" onClick={() => openEdit(q)} title="Düzenle">
                          <Edit3 size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn delete" onClick={() => setDeleteId(q.id)} title="Sil">
                          <Trash2 size={15} strokeWidth={1.6} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="company-cards">
          {paged.length === 0 ? (
            <div className="table-empty" style={{ gridColumn: '1 / -1' }}>
              {search || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen teklif bulunamadı</span></>
                : <><FileText size={24} strokeWidth={1.4} /><span>Henüz teklif oluşturulmamış</span></>
              }
            </div>
          ) : (
            paged.map((q) => (
              <div key={q.id} className="company-card" style={{ borderTop: '3px solid #22c55e' }}>
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                    <FileText size={18} strokeWidth={1.6} />
                  </div>
                  <div>
                    <code className="test-code">{q.quoteNo}</code>
                  </div>
                  <button
                    className={`status-badge ${q.status}`}
                    onClick={() => toggleStatus(q.id)}
                    style={{ marginLeft: 'auto' }}
                  >
                    {q.status === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <div className="company-card-body" onClick={() => setDetailQuote(q)} style={{ cursor: 'pointer' }}>
                  <h4>{q.companyName}</h4>
                  <div className="company-card-meta">
                    <span><FlaskConical size={12} strokeWidth={1.6} /> {q.items.length} test</span>
                    <span><DollarSign size={12} strokeWidth={1.6} /> {q.total.toLocaleString()} TL</span>
                    <span><Calendar size={12} strokeWidth={1.6} /> {q.createdAt}</span>
                  </div>
                </div>
                <div className="company-card-footer">
                  {q.notes && <span className="company-card-stats">{q.notes}</span>}
                  <div className="cell-actions" style={{ marginLeft: 'auto' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(q)} title="Düzenle">
                      <Edit3 size={15} strokeWidth={1.6} />
                    </button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(q.id)} title="Sil">
                      <Trash2 size={15} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="pagination">
        <div className="pagination-left">
          <span className="pagination-info">Toplam {filtered.length} kayıt</span>
          <select className="per-page-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}>
            <option value={10}>10 / sayfa</option>
            <option value={20}>20 / sayfa</option>
            <option value={50}>50 / sayfa</option>
          </select>
        </div>
        {totalPages > 1 && (
          <div className="pagination-btns">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={15} strokeWidth={1.6} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={15} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="header-icon"><FileText size={14} strokeWidth={2} /></span>
                {editing ? 'Teklif Düzenle' : 'Yeni Teklif Oluştur'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-section-card full">
                  <div className="card-header">Teklif Bilgileri</div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="field-group">
                      <label>Firma <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.company ? 'has-error' : ''}`}>
                        <Building2 size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formCompany} onChange={(e) => setFormCompany(e.target.value)}>
                          <option value="">Firma seçin</option>
                          {companies.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      {formErrors.company && <span className="field-error">{formErrors.company}</span>}
                    </div>

                    <div className="field-group">
                      <label>Test Ekle</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="input-wrap" style={{ flex: 1 }}>
                          <FlaskConical size={12} className="input-icon" strokeWidth={1.6} />
                          <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
                            <option value="">Test seçin</option>
                            {availableTests.filter((t) => t.status === 'active').map((t) => (
                              <option key={t.code} value={t.code}>{t.code} — {t.name} ({t.price} TL)</option>
                            ))}
                          </select>
                        </div>
                        <button className="btn btn-primary" onClick={addTest} disabled={!selectedTest} style={{ padding: '8px 16px', whiteSpace: 'nowrap', height: 38 }}>
                          <Plus size={14} strokeWidth={2} /> Ekle
                        </button>
                      </div>
                    </div>

                    {formErrors.items && <span className="field-error">{formErrors.items}</span>}

                    {formItems.length > 0 && (
                      <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)' }}>
                        <table className="data-table" style={{ minWidth: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ minWidth: 80 }}>Kod</th>
                              <th style={{ minWidth: 180 }}>Test Adı</th>
                              <th style={{ minWidth: 80 }}>Kategori</th>
                              <th style={{ width: 90 }}>Birim Fiyat</th>
                              <th style={{ width: 70 }}>Adet</th>
                              <th style={{ width: 90 }}>Tutar</th>
                              <th style={{ width: 40 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formItems.map((item, i) => (
                              <tr key={i}>
                                <td><code className="test-code">{item.testCode}</code></td>
                                <td>{item.testName}</td>
                                <td><span className="cell-sub">{item.category}</span></td>
                                <td>
                                  <input
                                    type="number"
                                    className="inline-input"
                                    value={item.price}
                                    onChange={(e) => updateItem(i, 'price', Math.max(0, Number(e.target.value)))}
                                    min={0}
                                    style={{ width: 70 }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="inline-input"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(i, 'quantity', Math.max(1, Number(e.target.value)))}
                                    min={1}
                                    style={{ width: 50 }}
                                  />
                                </td>
                                <td><span className="cell-number">{(item.price * item.quantity).toLocaleString()} TL</span></td>
                                <td>
                                  <button className="cell-action-btn delete" onClick={() => removeItem(i)} title="Kaldır">
                                    <X size={14} strokeWidth={1.6} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, padding: '8px 12px' }}>Toplam:</td>
                              <td style={{ fontWeight: 700, padding: '8px 12px', color: 'var(--accent)' }}>{formTotal.toLocaleString()} TL</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    <div className="field-group">
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Teklif notları..." rows={2} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Durum</label>
                      <div className="input-wrap">
                        <CheckCircle size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'active' | 'passive')}>
                          <option value="active">Aktif</option>
                          <option value="passive">Pasif</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Teklif Oluştur</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlertTriangle size={18} strokeWidth={1.6} style={{ color: '#ef4444', marginRight: 8 }} /> Teklifi Sil</h3>
            </div>
            <div className="modal-body">
              <p>
                <strong>{quotes.find((q) => q.id === deleteId)?.quoteNo}</strong> numaralı teklifi silmek istediğinize emin misiniz?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn btn-danger" onClick={handleDelete}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      {detailQuote && (
        <div className="modal-overlay" onClick={() => setDetailQuote(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                  <FileText size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <h3>{detailQuote.quoteNo}</h3>
                  <span className={`status-badge ${detailQuote.status}`} style={{ cursor: 'default' }}>
                    {detailQuote.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailQuote(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4><Building2 size={15} strokeWidth={1.8} /> Firma</h4>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Firma</span><strong>{detailQuote.companyName}</strong></div>
                    <div className="detail-row"><span>Tarih</span><strong>{detailQuote.createdAt}</strong></div>
                  </div>
                </div>
                <div className="detail-section full">
                  <h4><FlaskConical size={15} strokeWidth={1.8} /> Testler</h4>
                  <div className="table-container" style={{ margin: 0 }}>
                    <table className="data-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>Kod</th>
                          <th>Test Adı</th>
                          <th>Kategori</th>
                          <th>Birim Fiyat</th>
                          <th>Adet</th>
                          <th>Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailQuote.items.map((item, i) => (
                          <tr key={i}>
                            <td><code className="test-code">{item.testCode}</code></td>
                            <td>{item.testName}</td>
                            <td><span className="cell-sub">{item.category}</span></td>
                            <td>{item.price} TL</td>
                            <td>{item.quantity}</td>
                            <td><span className="cell-number">{(item.price * item.quantity).toLocaleString()} TL</span></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, padding: '8px 12px' }}>Toplam:</td>
                          <td style={{ fontWeight: 700, padding: '8px 12px', color: 'var(--accent)', fontSize: '1rem' }}>{detailQuote.total.toLocaleString()} TL</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                {detailQuote.notes && (
                  <div className="detail-section full">
                    <h4><FileText size={15} strokeWidth={1.8} /> Notlar</h4>
                    <p className="detail-notes">{detailQuote.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailQuote(null); openEdit(detailQuote) }}>
                <Edit3 size={15} strokeWidth={1.6} /> Düzenle
              </button>
              <button className="btn btn-primary" onClick={() => setDetailQuote(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
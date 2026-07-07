import { useState, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportToExcel } from '../../utils/exportToExcel'
import { FileText, Plus, Search, X, Edit3, Trash2, Wand2, DollarSign, Building2, FlaskConical, CheckCircle, Check, FileSpreadsheet, Calendar, LayoutList, LayoutGrid } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { SortArrow } from '../../components/SortArrow'
import { ToastBar } from '../../components/ToastBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { SortDir } from '../../hooks/useFilteredList'

interface QuoteItem {
  testCode: string; testName: string; category: string; price: number; quantity: number
}

interface Quote {
  id: number; quoteNo: string; companyName: string; quoteTitle?: string
  items: QuoteItem[]; total: number; notes: string
  status: 'active' | 'passive'; createdAt: string
}

const STORAGE_KEY = 'hantech_quotes'
type SortField = 'quoteNo' | 'companyName' | 'total' | 'createdAt' | 'status'

function getCompanies(): { name: string }[] {
  try { const raw = localStorage.getItem('hantech_companies'); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return []
}

function getTests(): { code: string; name: string; category: string; price: number; status: string }[] {
  try {
    const raw = localStorage.getItem('hantech_tests')
    if (raw) return JSON.parse(raw)
    const defaults = [
      { code: 'HEM-001', name: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji', price: 50, status: 'active' },
      { code: 'BIY-001', name: 'Açlık Kan Şekeri', category: 'Biyokimya', price: 25, status: 'active' },
      { code: 'BIY-003', name: 'Total Kolesterol', category: 'Biyokimya', price: 30, status: 'active' },
      { code: 'BIY-004', name: 'HDL - LDL Kolesterol', category: 'Biyokimya', price: 40, status: 'active' },
      { code: 'BIY-005', name: 'Trigliserit', category: 'Biyokimya', price: 25, status: 'active' },
      { code: 'BIY-006', name: 'ALT (SGPT)', category: 'Biyokimya', price: 20, status: 'active' },
      { code: 'BIY-007', name: 'AST (SGOT)', category: 'Biyokimya', price: 20, status: 'active' },
      { code: 'BIY-008', name: 'Kreatinin', category: 'Biyokimya', price: 20, status: 'active' },
      { code: 'BIY-009', name: 'Üre', category: 'Biyokimya', price: 20, status: 'active' },
      { code: 'BIY-010', name: 'Ürik Asit', category: 'Biyokimya', price: 25, status: 'active' },
      { code: 'RAD-001', name: 'PA Akciğer Grafisi', category: 'Radyoloji', price: 80, status: 'active' },
      { code: 'ODY-001', name: 'Odyometri Testi', category: 'Odyometri', price: 60, status: 'active' },
      { code: 'EKG-001', name: 'Elektrokardiyografi', category: 'EKG', price: 55, status: 'active' },
      { code: 'SPR-001', name: 'Spirometri (Solunum Fonksiyon)', category: 'Spirometri', price: 65, status: 'active' },
      { code: 'GEN-001', name: 'İdrar Tahlili (Tam İdrar)', category: 'Genel Sağlık', price: 30, status: 'active' },
    ]
    localStorage.setItem('hantech_tests', JSON.stringify(defaults))
    return defaults
  } catch { return [] }
}

function nextQuoteNo(existing: Quote[]): string {
  const max = existing.reduce((max, q) => {
    const num = parseInt(q.quoteNo.replace('TKF-', ''), 10)
    return isNaN(num) ? max : Math.max(max, num)
  }, 0)
  return 'TKF-' + String(max + 1).padStart(4, '0')
}

const SEED_QUOTES: Quote[] = [
  { id: 1, quoteNo: 'TKF-0001', companyName: 'ABC İnşaat San. Tic. A.Ş.', quoteTitle: 'İşe Giriş Muayene Teklifi - ABC İnşaat - 2026-06-01', items: [{ testCode: 'HEM-001', testName: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji', price: 50, quantity: 45 }, { testCode: 'BIY-001', testName: 'Açlık Kan Şekeri', category: 'Biyokimya', price: 25, quantity: 45 }, { testCode: 'RAD-001', testName: 'PA Akciğer Grafisi', category: 'Radyoloji', price: 80, quantity: 45 }], total: 6975, notes: 'Yıllık periyodik muayene.', status: 'active', createdAt: '2026-06-01' },
  { id: 2, quoteNo: 'TKF-0002', companyName: 'XYZ Enerji Üretim A.Ş.', quoteTitle: 'Mobil Sağlık Taraması Teklifi - XYZ Enerji - 2026-06-10', items: [{ testCode: 'EKG-001', testName: 'Elektrokardiyografi', category: 'EKG', price: 55, quantity: 128 }, { testCode: 'ODY-001', testName: 'Odyometri Testi', category: 'Odyometri', price: 60, quantity: 128 }, { testCode: 'SPR-001', testName: 'Spirometri (Solunum Fonksiyon)', category: 'Spirometri', price: 65, quantity: 128 }], total: 23040, notes: 'Santral sahası tüm personel.', status: 'active', createdAt: '2026-06-10' },
  { id: 3, quoteNo: 'TKF-0003', companyName: 'Defne Lojistik Taşımacılık', quoteTitle: 'İşe Giriş Muayene Teklifi - Defne Lojistik - 2026-06-15', items: [{ testCode: 'GEN-001', testName: 'İdrar Tahlili (Tam İdrar)', category: 'Genel Sağlık', price: 30, quantity: 23 }], total: 690, notes: '', status: 'active', createdAt: '2026-06-15' },
  { id: 4, quoteNo: 'TKF-0004', companyName: 'Mega Gıda Ürünleri Ltd. Şti.', quoteTitle: 'Mobil Sağlık Taraması Teklifi - Mega Gıda - 2026-05-20', items: [{ testCode: 'BIY-005', testName: 'Trigliserit', category: 'Biyokimya', price: 25, quantity: 67 }, { testCode: 'BIY-003', testName: 'Total Kolesterol', category: 'Biyokimya', price: 30, quantity: 67 }, { testCode: 'BIY-004', testName: 'HDL - LDL Kolesterol', category: 'Biyokimya', price: 40, quantity: 67 }], total: 6365, notes: 'Üretim hattı ve ofis personeli.', status: 'passive', createdAt: '2026-05-20' },
  { id: 5, quoteNo: 'TKF-0005', companyName: 'Pınar Tekstil İhracat A.Ş.', quoteTitle: 'İşe Giriş Muayene Teklifi - Pınar Tekstil - 2026-07-01', items: [{ testCode: 'HEM-001', testName: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji', price: 50, quantity: 312 }, { testCode: 'RAD-001', testName: 'PA Akciğer Grafisi', category: 'Radyoloji', price: 80, quantity: 312 }], total: 40560, notes: 'Atölye ve ofis alanları tüm çalışanlar.', status: 'active', createdAt: '2026-07-01' },
  { id: 6, quoteNo: 'TKF-0006', companyName: 'Güven Kimya Endüstrisi A.Ş.', quoteTitle: 'Mobil Sağlık Taraması Teklifi - Güven Kimya - 2026-07-12', items: [{ testCode: 'BIY-006', testName: 'ALT (SGPT)', category: 'Biyokimya', price: 20, quantity: 56 }, { testCode: 'BIY-007', testName: 'AST (SGOT)', category: 'Biyokimya', price: 20, quantity: 56 }, { testCode: 'BIY-008', testName: 'Kreatinin', category: 'Biyokimya', price: 20, quantity: 56 }], total: 3360, notes: 'Tehlikeli kimyasal üretim sahası.', status: 'active', createdAt: '2026-07-12' },
]

export default function QuotesPage() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useLocalStorage(STORAGE_KEY, SEED_QUOTES)
  const [companies] = useState(getCompanies)
  const [availableTests, setAvailableTests] = useState(getTests)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { toast, showToast } = useToast(3000)
  const searchRef = useRef<HTMLInputElement>(null)

  const [formCompany, setFormCompany] = useState('')
  const [formItems, setFormItems] = useState<QuoteItem[]>([])
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedTest, setSelectedTest] = useState('')

  const formTotal = useMemo(() => formItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [formItems])

  const filtered = useMemo(() => {
    return quotes
      .filter((q) => {
        if (filterStatus !== 'all' && q.status !== filterStatus) return false
        if (!search) return true
        const qs = search.toLowerCase()
        return q.quoteNo.toLowerCase().includes(qs) || q.companyName.toLowerCase().includes(qs)
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortField === 'quoteNo') return a.quoteNo.localeCompare(b.quoteNo) * dir
        if (sortField === 'companyName') return a.companyName.localeCompare(b.companyName) * dir
        if (sortField === 'total') return (a.total - b.total) * dir
        if (sortField === 'createdAt') return a.createdAt.localeCompare(b.createdAt) * dir
        return a.status.localeCompare(b.status) * dir
      })
  }, [quotes, search, filterStatus, sortField, sortDir])

  const totalFiltered = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const openAdd = useCallback(() => {
    setEditing(null); setFormCompany(''); setFormItems([]); setFormNotes(''); setFormStatus('active'); setFormErrors({}); setShowModal(true)
    setAvailableTests(getTests())
  }, [])

  const openEdit = useCallback((q: Quote) => {
    setEditing(q); setFormCompany(q.companyName); setFormItems([...q.items]); setFormNotes(q.notes); setFormStatus(q.status); setFormErrors({}); setShowModal(true)
    setAvailableTests(getTests())
  }, [])

  const addTest = useCallback(() => {
    if (!selectedTest) return
    const test = availableTests.find((t) => t.code === selectedTest)
    if (!test) return
    setFormItems((prev) => [...prev, { testCode: test.code, testName: test.name, category: test.category, price: test.price, quantity: 1 }])
    setSelectedTest('')
  }, [selectedTest, availableTests])

  const removeItem = useCallback((index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateItem = useCallback((index: number, field: 'price' | 'quantity', value: number) => {
    setFormItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }, [])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!formCompany) errors.company = 'Firma seçin'
    if (formItems.length === 0) errors.items = 'En az bir test ekleyin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formCompany, formItems])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    if (editing) {
      setQuotes((prev) => prev.map((q) => q.id === editing.id ? { ...q, companyName: formCompany, items: formItems, total: formTotal, notes: formNotes, status: formStatus } : q))
      showToast('success', 'Teklif güncellendi')
    } else {
      const newId = Math.max(...quotes.map((q) => q.id), 0) + 1
      setQuotes((prev) => [...prev, { id: newId, quoteNo: nextQuoteNo(quotes), companyName: formCompany, items: formItems, total: formTotal, notes: formNotes, status: formStatus, createdAt: new Date().toISOString().slice(0, 10) }])
      showToast('success', 'Teklif oluşturuldu')
    }
    setShowModal(false)
  }, [editing, formCompany, formItems, formNotes, formStatus, formTotal, validateForm, setQuotes, quotes, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    const name = quotes.find((q) => q.id === deleteId)?.quoteNo
    setQuotes((prev) => prev.filter((q) => q.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', `"${name}" silindi`)
  }, [deleteId, quotes, setQuotes, showToast])

  const toggleStatus = useCallback((id: number) => {
    setQuotes((prev) => prev.map((q) => {
      if (q.id !== id) return q
      const newStatus = q.status === 'active' ? 'passive' : 'active'
      showToast('success', `"${q.quoteNo}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
      return { ...q, status: newStatus }
    }))
  }, [setQuotes, showToast])

  const exportExcel = useCallback(() => {
    exportToExcel(quotes as unknown as Record<string, unknown>[], [
      { header: 'Teklif No', key: 'quoteNo' }, { header: 'Firma', key: 'companyName' },
      { header: 'Tutar', key: 'total', transform: (v) => String(v) + ' TL' },
      { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
      { header: 'Tarih', key: 'createdAt' },
    ], 'teklifler')
    showToast('success', 'Excel dışa aktarıldı')
  }, [quotes, showToast])

  const handlePageChange = useCallback((p: number) => setPage(p), [])
  const handlePerPageChange = useCallback((n: number) => { setPerPage(n); setPage(1) }, [])

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      <div className="content-top">
        <div><h2>Teklifler</h2><p className="content-subtitle">Firmalara test bazlı fiyat teklifleri oluşturun</p></div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/quotes/new')} style={{ gap: 8 }}>
            <Wand2 size={16} strokeWidth={2} /> Sihirbazla Oluştur
          </button>
          <button className="btn btn-ghost" onClick={openAdd} style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <Plus size={16} strokeWidth={2} /> Hızlı Ekle
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input ref={searchRef} type="text" placeholder="Teklif ara (no, firma)..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          {search && (<button className="table-search-clear" onClick={() => { setSearch(''); searchRef.current?.focus() }}><X size={14} strokeWidth={1.6} /></button>)}
        </div>
        <div className="table-filters">
          <div className="filter-tabs">
            {(['all', 'active', 'passive'] as const).map((f) => (
              <button key={f} className={`filter-tab ${filterStatus === f ? 'active' : ''}`}
                onClick={() => { setFilterStatus(f); setPage(1) }}>{f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}</button>
            ))}
          </div>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Tablo"><LayoutList size={15} strokeWidth={1.6} /></button>
            <button className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Kart"><LayoutGrid size={15} strokeWidth={1.6} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('quoteNo')} className="sortable">Teklif No <SortArrow field="quoteNo" sortField={sortField} sortDir={sortDir} /></th>
                <th style={{ minWidth: 180 }}>Başlık</th>
                <th onClick={() => handleSort('companyName')} className="sortable" style={{ minWidth: 200 }}>Firma <SortArrow field="companyName" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('total')} className="sortable">Toplam <SortArrow field="total" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('createdAt')} className="sortable">Tarih <SortArrow field="createdAt" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('status')} className="sortable">Durum <SortArrow field="status" sortField={sortField} sortDir={sortDir} /></th>
                <th style={{ width: 110 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty">
                  {search || filterStatus !== 'all'
                    ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen teklif bulunamadı</span></>
                    : <><FileText size={24} strokeWidth={1.4} /><span>Henüz teklif oluşturulmamış</span></>}
                </div></td></tr>
              ) : (
                paged.map((q) => (
                  <tr key={q.id} className="clickable-row" onClick={() => navigate(`/quotes/${q.id}`)}>
                    <td><code className="test-code">{q.quoteNo}</code></td>
                    <td><span className="cell-sub" style={{ fontSize: '0.78rem' }}>{q.quoteTitle || '\u2014'}</span></td>
                    <td><strong>{q.companyName}</strong></td>
                    <td><span className="cell-number">{q.total.toLocaleString()} TL</span></td>
                    <td><span className="cell-date"><Calendar size={12} strokeWidth={1.6} /> {q.createdAt}</span></td>
                    <td><button className={`status-badge ${q.status}`} onClick={(e) => { e.stopPropagation(); toggleStatus(q.id) }} title="Durumu değiştir">{q.status === 'active' ? 'Aktif' : 'Pasif'}</button></td>
                    <td><div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="cell-action-btn edit" onClick={() => openEdit(q)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                      <button className="cell-action-btn delete" onClick={() => setDeleteId(q.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
                    </div></td>
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
                : <><FileText size={24} strokeWidth={1.4} /><span>Henüz teklif oluşturulmamış</span></>}
            </div>
          ) : (
            paged.map((q) => (
              <div key={q.id} className="company-card" style={{ borderTop: '3px solid #22c55e' }}>
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#f0fdf4', color: '#22c55e' }}><FileText size={18} strokeWidth={1.6} /></div>
                  <div><code className="test-code">{q.quoteNo}</code></div>
                  <button className={`status-badge ${q.status}`} onClick={() => toggleStatus(q.id)} style={{ marginLeft: 'auto' }}>{q.status === 'active' ? 'Aktif' : 'Pasif'}</button>
                </div>
                <div className="company-card-body" onClick={() => navigate(`/quotes/${q.id}`)} style={{ cursor: 'pointer' }}>
                  <h4>{q.companyName}</h4>
                  {q.quoteTitle && <div className="cell-sub" style={{ fontSize: '0.75rem', marginBottom: 4 }}>{q.quoteTitle}</div>}
                  <div className="company-card-meta">
                    <span><FlaskConical size={12} strokeWidth={1.6} /> {q.items.length} test</span>
                    <span><DollarSign size={12} strokeWidth={1.6} /> {q.total.toLocaleString()} TL</span>
                    <span><Calendar size={12} strokeWidth={1.6} /> {q.createdAt}</span>
                  </div>
                </div>
                <div className="company-card-footer">
                  {q.notes && <span className="company-card-stats">{q.notes}</span>}
                  <div className="cell-actions" style={{ marginLeft: 'auto' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(q)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(q.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Pagination total={totalFiltered} page={page} perPage={perPage} onPageChange={handlePageChange} onPerPageChange={handlePerPageChange} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="header-icon"><FileText size={14} strokeWidth={2} /></span>{editing ? 'Teklif Düzenle' : 'Yeni Teklif Oluştur'}</h3>
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
                        </select></div>
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
                              <th style={{ minWidth: 80 }}>Kod</th><th style={{ minWidth: 180 }}>Test Adı</th>
                              <th style={{ minWidth: 80 }}>Kategori</th><th style={{ width: 90 }}>Birim Fiyat</th>
                              <th style={{ width: 70 }}>Adet</th><th style={{ width: 90 }}>Tutar</th><th style={{ width: 40 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formItems.map((item, i) => (
                              <tr key={i}>
                                <td><code className="test-code">{item.testCode}</code></td>
                                <td>{item.testName}</td>
                                <td><span className="cell-sub">{item.category}</span></td>
                                <td><input type="number" className="inline-input" value={item.price}
                                  onChange={(e) => updateItem(i, 'price', Math.max(0, Number(e.target.value)))} min={0} style={{ width: 70 }} /></td>
                                <td><input type="number" className="inline-input" value={item.quantity}
                                  onChange={(e) => updateItem(i, 'quantity', Math.max(1, Number(e.target.value)))} min={1} style={{ width: 50 }} /></td>
                                <td><span className="cell-number">{(item.price * item.quantity).toLocaleString()} TL</span></td>
                                <td><button className="cell-action-btn delete" onClick={() => removeItem(i)} title="Kaldır"><X size={14} strokeWidth={1.6} /></button></td>
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
                      <div className="input-wrap textarea-wrap"><FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Teklif notları..." rows={2} /></div>
                    </div>
                    <div className="field-group">
                      <label>Durum</label>
                      <div className="input-wrap"><CheckCircle size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'active' | 'passive')}>
                          <option value="active">Aktif</option><option value="passive">Pasif</option>
                        </select></div>
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

      <ConfirmDialog open={deleteId !== null} title="Teklifi Sil"
        itemName={quotes.find((q) => q.id === deleteId)?.quoteNo || ''}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
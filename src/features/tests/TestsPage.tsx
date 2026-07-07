import { useState, useRef, useMemo, useCallback } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  FlaskConical, Plus, Search, X, Edit3, Trash2,
  FileText, Tag, DollarSign,
  CheckCircle, Check, LayoutList, LayoutGrid, FileSpreadsheet,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { SortArrow } from '../../components/SortArrow'
import { ToastBar } from '../../components/ToastBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { SortDir } from '../../hooks/useFilteredList'

interface TestItem {
  id: number; code: string; name: string; category: string
  price: number; status: 'active' | 'passive'; createdAt: string
}

const CATEGORIES = [
  'Biyokimya', 'Hematoloji', 'Mikrobiyoloji', 'Patoloji',
  'Radyoloji', 'Odyometri', 'EKG', 'Spirometri',
  'Göz Testi', 'İşitme Testi', 'Psikoteknik',
  'Genel Sağlık', 'Diyetisyen', 'Fizyoterapi',
]

const CATEGORY_PREFIX: Record<string, string> = {
  'Biyokimya': 'BIY', 'Hematoloji': 'HEM', 'Mikrobiyoloji': 'MIK', 'Patoloji': 'PAT',
  'Radyoloji': 'RAD', 'Odyometri': 'ODY', 'EKG': 'EKG', 'Spirometri': 'SPR',
  'Göz Testi': 'GOZ', 'İşitme Testi': 'ISIT', 'Psikoteknik': 'PSI',
  'Genel Sağlık': 'GEN', 'Diyetisyen': 'DIY', 'Fizyoterapi': 'FIZ',
}

const STORAGE_KEY = 'hantech_tests'
type SortField = 'code' | 'name' | 'category' | 'price' | 'status'

const DEFAULT_TESTS: TestItem[] = [
  { id: 1, code: 'HEM-001', name: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji', price: 50, status: 'active', createdAt: '2025-01-10' },
  { id: 2, code: 'BIY-001', name: 'Açlık Kan Şekeri', category: 'Biyokimya', price: 25, status: 'active', createdAt: '2025-01-10' },
  { id: 3, code: 'BIY-003', name: 'Total Kolesterol', category: 'Biyokimya', price: 30, status: 'active', createdAt: '2025-01-10' },
  { id: 4, code: 'BIY-004', name: 'HDL - LDL Kolesterol', category: 'Biyokimya', price: 40, status: 'active', createdAt: '2025-01-10' },
  { id: 5, code: 'BIY-005', name: 'Trigliserit', category: 'Biyokimya', price: 25, status: 'active', createdAt: '2025-01-10' },
  { id: 6, code: 'BIY-006', name: 'ALT (SGPT)', category: 'Biyokimya', price: 20, status: 'active', createdAt: '2025-01-10' },
  { id: 7, code: 'BIY-007', name: 'AST (SGOT)', category: 'Biyokimya', price: 20, status: 'active', createdAt: '2025-01-10' },
  { id: 8, code: 'BIY-008', name: 'Kreatinin', category: 'Biyokimya', price: 20, status: 'active', createdAt: '2025-01-10' },
  { id: 9, code: 'BIY-009', name: 'Üre', category: 'Biyokimya', price: 20, status: 'active', createdAt: '2025-01-10' },
  { id: 10, code: 'BIY-010', name: 'Ürik Asit', category: 'Biyokimya', price: 25, status: 'active', createdAt: '2025-01-10' },
  { id: 11, code: 'RAD-001', name: 'PA Akciğer Grafisi', category: 'Radyoloji', price: 80, status: 'active', createdAt: '2025-01-10' },
  { id: 12, code: 'ODY-001', name: 'Odyometri Testi', category: 'Odyometri', price: 60, status: 'active', createdAt: '2025-01-10' },
  { id: 13, code: 'EKG-001', name: 'Elektrokardiyografi', category: 'EKG', price: 55, status: 'active', createdAt: '2025-01-10' },
  { id: 14, code: 'SPR-001', name: 'Spirometri (Solunum Fonksiyon)', category: 'Spirometri', price: 65, status: 'active', createdAt: '2025-01-10' },
  { id: 15, code: 'GEN-001', name: 'İdrar Tahlili (Tam İdrar)', category: 'Genel Sağlık', price: 30, status: 'active', createdAt: '2025-01-10' },
  { id: 16, code: 'GEN-002', name: 'Gaita Tahlili', category: 'Genel Sağlık', price: 35, status: 'passive', createdAt: '2025-01-10' },
]

function generateCode(category: string, existing: TestItem[]): string {
  const prefix = CATEGORY_PREFIX[category] || 'XXX'
  const max = existing
    .filter((t) => t.code.startsWith(prefix + '-'))
    .reduce((max, t) => {
      const num = parseInt(t.code.split('-')[1], 10)
      return isNaN(num) ? max : Math.max(max, num)
    }, 0)
  return prefix + '-' + String(max + 1).padStart(3, '0')
}

export default function TestsPage() {
  const [tests, setTests] = useLocalStorage(STORAGE_KEY, DEFAULT_TESTS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TestItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailTest, setDetailTest] = useState<TestItem | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { toast, showToast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ code: '', name: '', category: '', price: 0, status: 'active' as 'active' | 'passive' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const updateForm = useCallback((field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const uniqueCategories = useMemo(() => [...new Set(tests.map((t) => t.category))].sort(), [tests])

  const filtered = useMemo(() => {
    return tests
      .filter((t) => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false
        if (filterCategory && t.category !== filterCategory) return false
        if (!search) return true
        const q = search.toLowerCase()
        return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortField === 'code') return a.code.localeCompare(b.code) * dir
        if (sortField === 'name') return a.name.localeCompare(b.name) * dir
        if (sortField === 'category') return a.category.localeCompare(b.category) * dir
        if (sortField === 'price') return (a.price - b.price) * dir
        return a.status.localeCompare(b.status) * dir
      })
  }, [tests, search, filterStatus, filterCategory, sortField, sortDir])

  const totalFiltered = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const handleCategoryChange = useCallback((cat: string) => {
    setForm((prev) => {
      const code = prev.code || (!editing && cat ? generateCode(cat, tests) : prev.code)
      return { ...prev, category: cat, code }
    })
  }, [editing, tests])

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm({ code: '', name: '', category: '', price: 0, status: 'active' })
    setFormErrors({})
    setShowModal(true)
  }, [])

  const openEdit = useCallback((t: TestItem) => {
    setEditing(t)
    setForm({ code: t.code, name: t.name, category: t.category, price: t.price, status: t.status })
    setFormErrors({})
    setShowModal(true)
  }, [])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Test adı gerekli'
    if (!form.category) errors.category = 'Kategori seçin'
    if (form.price <= 0) errors.price = 'Fiyat 0\'dan büyük olmalı'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    const code = editing ? form.code : (form.code || generateCode(form.category, tests))
    if (editing) {
      setTests((prev) => prev.map((t) => t.id === editing.id ? { ...t, code, name: form.name, category: form.category, price: form.price, status: form.status } : t))
      showToast('success', `"${form.name}" güncellendi`)
    } else {
      const newId = Math.max(...tests.map((t) => t.id), 0) + 1
      setTests((prev) => [...prev, { id: newId, code, name: form.name, category: form.category, price: form.price, status: form.status, createdAt: new Date().toISOString().slice(0, 10) }])
      showToast('success', `"${form.name}" eklendi`)
    }
    setShowModal(false)
  }, [editing, form, validateForm, setTests, tests, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    const name = tests.find((t) => t.id === deleteId)?.name
    setTests((prev) => prev.filter((t) => t.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', `"${name}" silindi`)
  }, [deleteId, tests, setTests, showToast])

  const toggleStatus = useCallback((id: number) => {
    setTests((prev) => prev.map((t) => {
      if (t.id !== id) return t
      const newStatus = t.status === 'active' ? 'passive' : 'active'
      showToast('success', `"${t.name}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
      return { ...t, status: newStatus }
    }))
  }, [setTests, showToast])

  const exportExcel = useCallback(() => {
    exportToExcel(tests as unknown as Record<string, unknown>[], [
      { header: 'Test Kodu', key: 'code' },
      { header: 'Test Adı', key: 'name' },
      { header: 'Kategori', key: 'category' },
      { header: 'Fiyat', key: 'price', transform: (v) => String(v) + ' TL' },
      { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
    ], 'testler')
    showToast('success', 'Excel dışa aktarıldı')
  }, [tests, showToast])

  const getCategoryColor = useCallback((cat: string): string => {
    const colors: Record<string, string> = {
      'Biyokimya': '#3b82f6', 'Hematoloji': '#ef4444', 'Mikrobiyoloji': '#8b5cf6',
      'Patoloji': '#a855f7', 'Radyoloji': '#06b6d4', 'Odyometri': '#14b8a6',
      'EKG': '#f59e0b', 'Spirometri': '#f97316', 'Göz Testi': '#22d3ee',
      'İşitme Testi': '#10b981', 'Psikoteknik': '#6366f1',
      'Genel Sağlık': '#65a30d', 'Diyetisyen': '#ec4899', 'Fizyoterapi': '#0ea5e9',
    }
    return colors[cat] || '#64748b'
  }, [])

  const handlePageChange = useCallback((p: number) => setPage(p), [])
  const handlePerPageChange = useCallback((n: number) => { setPerPage(n); setPage(1) }, [])

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      <div className="content-top">
        <div>
          <h2>Testler</h2>
          <p className="content-subtitle">OSGB test ve tetkik tanımlarını yönetin</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} strokeWidth={2} /> Test Ekle</button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input ref={searchRef} type="text" placeholder="Test ara (kod, ad, kategori)..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          {search && (
            <button className="table-search-clear" onClick={() => { setSearch(''); searchRef.current?.focus() }}>
              <X size={14} strokeWidth={1.6} />
            </button>
          )}
        </div>
        <div className="table-filters">
          {uniqueCategories.length > 0 && (
            <select className="filter-select" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
              <option value="">Tüm Kategoriler</option>
              {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div className="filter-tabs">
            {(['all', 'active', 'passive'] as const).map((f) => (
              <button key={f} className={`filter-tab ${filterStatus === f ? 'active' : ''}`}
                onClick={() => { setFilterStatus(f); setPage(1) }}>
                {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Tablo görünümü"><LayoutList size={15} strokeWidth={1.6} /></button>
            <button className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Kart görünümü"><LayoutGrid size={15} strokeWidth={1.6} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('code')} className="sortable" style={{ minWidth: 110 }}>Test Kodu <SortArrow field="code" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 260 }}>Test Adı <SortArrow field="name" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('category')} className="sortable">Kategori <SortArrow field="category" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('price')} className="sortable" style={{ minWidth: 90 }}>Fiyat <SortArrow field="price" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('status')} className="sortable">Durum <SortArrow field="status" sortField={sortField} sortDir={sortDir} /></th>
                <th style={{ width: 90 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty">
                  {search || filterCategory || filterStatus !== 'all'
                    ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen test bulunamadı</span></>
                    : <><FlaskConical size={24} strokeWidth={1.4} /><span>Henüz test eklenmemiş</span></>}
                </div></td></tr>
              ) : (
                paged.map((t) => (
                  <tr key={t.id} className="clickable-row" onClick={() => setDetailTest(t)}>
                    <td><code className="test-code">{t.code}</code></td>
                    <td><strong>{t.name}</strong></td>
                    <td><span className="sector-badge" style={{ background: getCategoryColor(t.category) + '18', color: getCategoryColor(t.category) }}>{t.category}</span></td>
                    <td><span className="cell-number">{t.price} TL</span></td>
                    <td><button className={`status-badge ${t.status}`} onClick={(e) => { e.stopPropagation(); toggleStatus(t.id) }} title="Durumu değiştir">{t.status === 'active' ? 'Aktif' : 'Pasif'}</button></td>
                    <td><div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="cell-action-btn edit" onClick={() => openEdit(t)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                      <button className="cell-action-btn delete" onClick={() => setDeleteId(t.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
              {search || filterCategory || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen test bulunamadı</span></>
                : <><FlaskConical size={24} strokeWidth={1.4} /><span>Henüz test eklenmemiş</span></>}
            </div>
          ) : (
            paged.map((t) => (
              <div key={t.id} className="company-card">
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: getCategoryColor(t.category) + '20', color: getCategoryColor(t.category) }}>
                    <FlaskConical size={18} strokeWidth={1.6} />
                  </div>
                  <button className={`status-badge ${t.status}`} onClick={() => toggleStatus(t.id)} title="Durumu değiştir">{t.status === 'active' ? 'Aktif' : 'Pasif'}</button>
                </div>
                <div className="company-card-body" onClick={() => setDetailTest(t)} style={{ cursor: 'pointer' }}>
                  <h4>{t.name}</h4>
                  <code className="test-code" style={{ fontSize: '0.75rem' }}>{t.code}</code>
                  <div className="company-card-meta">
                    <span><Tag size={12} strokeWidth={1.6} /> {t.category}</span>
                    <span><DollarSign size={12} strokeWidth={1.6} /> {t.price} TL</span>
                  </div>
                </div>
                <div className="company-card-footer">
                  <div className="cell-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(t)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(t.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="header-icon"><FlaskConical size={14} strokeWidth={2} /></span>{editing ? 'Test Düzenle' : 'Yeni Test Ekle'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-section-card full">
                  <div className="card-header">Test Bilgileri</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Test Adı <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}><FlaskConical size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Test adı" autoFocus /></div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Fiyat <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.price ? 'has-error' : ''}`}><DollarSign size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="number" value={form.price} onChange={(e) => updateForm('price', Math.max(0, Number(e.target.value)))} placeholder="0" min={0} /></div>
                      {formErrors.price && <span className="field-error">{formErrors.price}</span>}
                    </div>
                    <div className="field-group">
                      <label>Durum</label>
                      <div className="input-wrap"><CheckCircle size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                          <option value="active">Aktif</option><option value="passive">Pasif</option>
                        </select></div>
                    </div>
                    <div className="field-group">
                      <label>Kategori <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.category ? 'has-error' : ''}`}><Tag size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)}>
                          <option value="">Seçiniz</option>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select></div>
                      {formErrors.category && <span className="field-error">{formErrors.category}</span>}
                    </div>
                    <div className="field-group">
                      <label>Test Kodu</label>
                      <div className="input-wrap"><FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.code} placeholder="Otomatik oluşur" readOnly style={{ color: 'var(--text-muted)', cursor: 'default' }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Test Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={deleteId !== null} title="Testi Sil"
        itemName={tests.find((t) => t.id === deleteId)?.name || ''}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      {detailTest && (
        <div className="modal-overlay" onClick={() => setDetailTest(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg" style={{ background: getCategoryColor(detailTest.category) + '20', color: getCategoryColor(detailTest.category) }}>
                  <FlaskConical size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <h3>{detailTest.name}</h3>
                  <span className={`status-badge ${detailTest.status}`} style={{ cursor: 'default' }}>{detailTest.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailTest(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-rows">
                <div className="detail-row"><span>Test Kodu</span><strong>{detailTest.code}</strong></div>
                <div className="detail-row"><span>Kategori</span><strong>{detailTest.category}</strong></div>
                <div className="detail-row"><span>Fiyat</span><strong>{detailTest.price} TL</strong></div>
                <div className="detail-row"><span>Oluşturulma</span><strong>{detailTest.createdAt}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailTest(null); openEdit(detailTest) }}><Edit3 size={15} strokeWidth={1.6} /> Düzenle</button>
              <button className="btn btn-primary" onClick={() => setDetailTest(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
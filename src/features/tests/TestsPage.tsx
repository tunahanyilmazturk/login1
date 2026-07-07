import { useState, useRef, useEffect } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  FlaskConical, Plus, Search, X, Edit3, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, Tag, DollarSign,
  CheckCircle, Check, ArrowUpDown, LayoutList, LayoutGrid, FileSpreadsheet,
} from 'lucide-react'

interface TestItem {
  id: number
  code: string
  name: string
  category: string
  price: number
  status: 'active' | 'passive'
  createdAt: string
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

const STORAGE_KEY = 'hantech_tests'

function loadTests(): TestItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
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
}

type SortField = 'code' | 'name' | 'category' | 'price' | 'status'
type SortDir = 'asc' | 'desc'

type ToastType = 'success' | 'error'

export default function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>(loadTests)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TestItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPrice, setFormPrice] = useState(0)
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests))
  }, [tests])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
  }

  const filtered = tests
    .filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterCategory && t.category !== filterCategory) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'code') return a.code.localeCompare(b.code) * dir
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir
      if (sortField === 'category') return a.category.localeCompare(b.category) * dir
      if (sortField === 'price') return (a.price - b.price) * dir
      return a.status.localeCompare(b.status) * dir
    })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const uniqueCategories = [...new Set(tests.map((t) => t.category))].sort()

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function openAdd() {
    setEditing(null)
    setFormCode(''); setFormName(''); setFormCategory(''); setFormPrice(0); setFormStatus('active'); setFormErrors({}); setShowModal(true)
  }

  function openEdit(t: TestItem) {
    setEditing(t)
    setFormCode(t.code); setFormName(t.name); setFormCategory(t.category); setFormPrice(t.price); setFormStatus(t.status); setFormErrors({}); setShowModal(true)
  }

  function handleCategoryChange(cat: string) {
    setFormCategory(cat)
    if (!editing && cat) {
      setFormCode(generateCode(cat, tests))
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!formName.trim()) errors.name = 'Test adı gerekli'
    if (!formCategory) errors.category = 'Kategori seçin'
    if (formPrice <= 0) errors.price = 'Fiyat 0\'dan büyük olmalı'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return
    const code = editing ? formCode : (formCode || generateCode(formCategory, tests))
    if (editing) {
      setTests((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, code, name: formName, category: formCategory, price: formPrice, status: formStatus }
            : t
        )
      )
      showToast('success', '"' + formName + '" güncellendi')
    } else {
      const newId = Math.max(...tests.map((t) => t.id), 0) + 1
      setTests((prev) => [
        ...prev,
        { id: newId, code, name: formName, category: formCategory, price: formPrice, status: formStatus, createdAt: new Date().toISOString().slice(0, 10) },
      ])
      showToast('success', '"' + formName + '" eklendi')
    }
    setShowModal(false)
  }

  function handleDelete() {
    if (!deleteId) return
    const name = tests.find((t) => t.id === deleteId)?.name
    setTests((prev) => prev.filter((t) => t.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', '"' + name + '" silindi')
  }

  function toggleStatus(id: number) {
    setTests((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const newStatus = t.status === 'active' ? 'passive' : 'active'
        showToast('success', '"' + t.name + '" ' + (newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'))
        return { ...t, status: newStatus as 'active' | 'passive' }
      })
    )
  }

  function exportExcel() {
    exportToExcel(
      tests as unknown as Record<string, unknown>[],
      [
        { header: 'Test Kodu', key: 'code' },
        { header: 'Test Adı', key: 'name' },
        { header: 'Kategori', key: 'category' },
        { header: 'Fiyat', key: 'price', transform: (v) => String(v) + ' TL' },
        { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
      ],
      'testler',
    )
    showToast('success', 'Excel dışa aktarıldı')
  }

  function getCategoryColor(cat: string): string {
    const colors: Record<string, string> = {
      'Biyokimya': '#3b82f6', 'Hematoloji': '#ef4444', 'Mikrobiyoloji': '#8b5cf6',
      'Patoloji': '#a855f7', 'Radyoloji': '#06b6d4', 'Odyometri': '#14b8a6',
      'EKG': '#f59e0b', 'Spirometri': '#f97316', 'Göz Testi': '#22d3ee',
      'İşitme Testi': '#10b981', 'Psikoteknik': '#6366f1',
      'Genel Sağlık': '#65a30d', 'Diyetisyen': '#ec4899', 'Fizyoterapi': '#0ea5e9',
    }
    return colors[cat] || '#64748b'
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
          <h2>Testler</h2>
          <p className="content-subtitle">OSGB test ve tetkik tanımlarını yönetin</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Test Ekle
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Test ara (kod, ad, kategori)..."
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
          {uniqueCategories.length > 0 && (
            <select className="filter-select" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
              <option value="">Tüm Kategoriler</option>
              {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
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
                <th onClick={() => handleSort('code')} className="sortable" style={{ minWidth: 110 }}>
                  Test Kodu <SortArrow field="code" />
                </th>
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 260 }}>
                  Test Adı <SortArrow field="name" />
                </th>
                <th onClick={() => handleSort('category')} className="sortable">
                  Kategori <SortArrow field="category" />
                </th>
                <th onClick={() => handleSort('price')} className="sortable" style={{ minWidth: 90 }}>
                  Fiyat <SortArrow field="price" />
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Durum <SortArrow field="status" />
                </th>
                <th style={{ width: 90 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      {search || filterCategory || filterStatus !== 'all'
                        ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen test bulunamadı</span></>
                        : <><FlaskConical size={24} strokeWidth={1.4} /><span>Henüz test eklenmemiş</span></>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((t) => (
                  <tr key={t.id}>
                    <td><code className="test-code">{t.code}</code></td>
                    <td><strong>{t.name}</strong></td>
                    <td>
                      <span className="sector-badge" style={{ background: getCategoryColor(t.category) + '18', color: getCategoryColor(t.category) }}>
                        {t.category}
                      </span>
                    </td>
                    <td><span className="cell-number">{t.price} TL</span></td>
                    <td>
                      <button
                        className={`status-badge ${t.status}`}
                        onClick={() => toggleStatus(t.id)}
                        title="Durumu değiştir"
                      >
                        {t.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="cell-action-btn edit" onClick={() => openEdit(t)} title="Düzenle">
                          <Edit3 size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn delete" onClick={() => setDeleteId(t.id)} title="Sil">
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
              {search || filterCategory || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen test bulunamadı</span></>
                : <><FlaskConical size={24} strokeWidth={1.4} /><span>Henüz test eklenmemiş</span></>
              }
            </div>
          ) : (
            paged.map((t) => (
              <div key={t.id} className="company-card">
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: getCategoryColor(t.category) + '20', color: getCategoryColor(t.category) }}>
                    <FlaskConical size={18} strokeWidth={1.6} />
                  </div>
                  <button
                    className={`status-badge ${t.status}`}
                    onClick={() => toggleStatus(t.id)}
                    title="Durumu değiştir"
                  >
                    {t.status === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <div className="company-card-body">
                  <h4>{t.name}</h4>
                  <code className="test-code" style={{ fontSize: '0.75rem' }}>{t.code}</code>
                  <div className="company-card-meta">
                    <span><Tag size={12} strokeWidth={1.6} /> {t.category}</span>
                    <span><DollarSign size={12} strokeWidth={1.6} /> {t.price} TL</span>
                  </div>
                </div>
                <div className="company-card-footer">
                  <div className="cell-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(t)} title="Düzenle">
                      <Edit3 size={15} strokeWidth={1.6} />
                    </button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(t.id)} title="Sil">
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
            <option value={100}>100 / sayfa</option>
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
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="header-icon"><FlaskConical size={14} strokeWidth={2} /></span>
                {editing ? 'Test Düzenle' : 'Yeni Test Ekle'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-section-card full">
                  <div className="card-header">Test Bilgileri</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Test Adı <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}>
                        <FlaskConical size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Test adı" autoFocus />
                      </div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Fiyat <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.price ? 'has-error' : ''}`}>
                        <DollarSign size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="number" value={formPrice} onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value)))} placeholder="0" min={0} />
                      </div>
                      {formErrors.price && <span className="field-error">{formErrors.price}</span>}
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
                    <div className="field-group">
                      <label>Kategori <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.category ? 'has-error' : ''}`}>
                        <Tag size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                          <option value="">Seçiniz</option>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {formErrors.category && <span className="field-error">{formErrors.category}</span>}
                    </div>
                    <div className="field-group">
                      <label>Test Kodu</label>
                      <div className="input-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formCode} placeholder="Otomatik oluşur" readOnly style={{ color: 'var(--text-muted)', cursor: 'default' }} />
                      </div>
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

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlertTriangle size={18} strokeWidth={1.6} style={{ color: '#ef4444', marginRight: 8 }} /> Testi Sil</h3>
            </div>
            <div className="modal-body">
              <p>
                <strong>{tests.find((t) => t.id === deleteId)?.name}</strong> testini silmek istediğinize emin misiniz?
              </p>
              <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn btn-danger" onClick={handleDelete}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Monitor, Plus, Search, X, Edit3, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, Tag, Hash,
  CheckCircle, Check, ArrowUpDown, LayoutList, LayoutGrid, FileSpreadsheet,
} from 'lucide-react'

interface Equipment {
  id: number
  name: string
  type: string
  brand: string
  serialNo: string
  notes: string
  status: 'active' | 'passive'
  createdAt: string
}

const EQUIPMENT_TYPES = [
  'SFT (Solunum Fonksiyon)', 'Odyometri', 'EKG', 'Göz Muayene',
  'Röntgen / Radyoloji', 'Ultrason', 'Kan Tahlil Cihazı',
  'İdrar Tahlil Cihazı', 'Psikoteknik', 'Diyetisyen',
  'Fizyoterapi', 'Genel Sağlık Kontrol',
]

const STORAGE_KEY = 'hantech_equipment'

function loadEquipment(): Equipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { id: 1, name: 'Spirolab III SFT Cihazı', type: 'SFT (Solunum Fonksiyon)', brand: 'MIR', serialNo: 'SPR-2024-001', notes: 'Yıllık kalibrasyon yapıldı', status: 'active', createdAt: '2024-01-15' },
    { id: 2, name: 'Interacoustics AD629 Odyometre', type: 'Odyometri', brand: 'Interacoustics', serialNo: 'ODY-2024-002', notes: '', status: 'active', createdAt: '2024-02-10' },
    { id: 3, name: 'Nihon Kohden ECG-2150 EKG Cihazı', type: 'EKG', brand: 'Nihon Kohden', serialNo: 'EKG-2023-015', notes: '12 kanallı EKG', status: 'active', createdAt: '2023-11-20' },
    { id: 4, name: 'Topcon KR-8800 Otorefraktometre', type: 'Göz Muayene', brand: 'Topcon', serialNo: 'GOZ-2024-001', notes: 'Göz tarama cihazı', status: 'active', createdAt: '2024-03-05' },
    { id: 5, name: 'Siemens Multix Fusion Röntgen', type: 'Röntgen / Radyoloji', brand: 'Siemens', serialNo: 'RAD-2022-008', notes: 'Dijital röntgen cihazı', status: 'active', createdAt: '2022-06-01' },
    { id: 6, name: 'Mindray BC-3000 Kan Sayım Cihazı', type: 'Kan Tahlil Cihazı', brand: 'Mindray', serialNo: 'HEM-2024-003', notes: 'Tam kan sayımı için', status: 'active', createdAt: '2024-04-12' },
    { id: 7, name: 'Dirui H-500 İdrar Analiz Cihazı', type: 'İdrar Tahlil Cihazı', brand: 'Dirui', serialNo: 'IDR-2024-001', notes: '', status: 'active', createdAt: '2024-05-20' },
    { id: 8, name: 'GE Logiq F6 Ultrason', type: 'Ultrason', brand: 'GE Healthcare', serialNo: 'USG-2023-004', notes: 'Batın ultrasonu', status: 'passive', createdAt: '2023-08-15' },
  ]
}

type SortField = 'name' | 'type' | 'brand' | 'status'
type SortDir = 'asc' | 'desc'

type ToastType = 'success' | 'error'

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>(loadEquipment)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [filterType, setFilterType] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formSerialNo, setFormSerialNo] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment))
  }, [equipment])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
  }

  const filtered = equipment
    .filter((e) => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false
      if (filterType && e.type !== filterType) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.serialNo.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir
      if (sortField === 'type') return a.type.localeCompare(b.type) * dir
      if (sortField === 'brand') return a.brand.localeCompare(b.brand) * dir
      return a.status.localeCompare(b.status) * dir
    })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const uniqueTypes = [...new Set(equipment.map((e) => e.type))].sort()

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function openAdd() {
    setEditing(null)
    setFormName(''); setFormType(''); setFormBrand(''); setFormSerialNo(''); setFormNotes(''); setFormStatus('active'); setFormErrors({}); setShowModal(true)
  }

  function openEdit(e: Equipment) {
    setEditing(e)
    setFormName(e.name); setFormType(e.type); setFormBrand(e.brand); setFormSerialNo(e.serialNo); setFormNotes(e.notes); setFormStatus(e.status); setFormErrors({}); setShowModal(true)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!formName.trim()) errors.name = 'Ekipman adı gerekli'
    if (!formType) errors.type = 'Tür seçin'
    if (!formBrand.trim()) errors.brand = 'Marka gerekli'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return
    if (editing) {
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === editing.id
            ? { ...e, name: formName, type: formType, brand: formBrand, serialNo: formSerialNo, notes: formNotes, status: formStatus }
            : e
        )
      )
      showToast('success', '"' + formName + '" güncellendi')
    } else {
      const newId = Math.max(...equipment.map((e) => e.id), 0) + 1
      setEquipment((prev) => [
        ...prev,
        { id: newId, name: formName, type: formType, brand: formBrand, serialNo: formSerialNo, notes: formNotes, status: formStatus, createdAt: new Date().toISOString().slice(0, 10) },
      ])
      showToast('success', '"' + formName + '" eklendi')
    }
    setShowModal(false)
  }

  function handleDelete() {
    if (!deleteId) return
    const name = equipment.find((e) => e.id === deleteId)?.name
    setEquipment((prev) => prev.filter((e) => e.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', '"' + name + '" silindi')
  }

  function toggleStatus(id: number) {
    setEquipment((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        const newStatus = e.status === 'active' ? 'passive' : 'active'
        showToast('success', '"' + e.name + '" ' + (newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'))
        return { ...e, status: newStatus as 'active' | 'passive' }
      })
    )
  }

  function exportExcel() {
    exportToExcel(
      equipment as unknown as Record<string, unknown>[],
      [
        { header: 'Ekipman Adı', key: 'name' },
        { header: 'Tür', key: 'type' },
        { header: 'Marka', key: 'brand' },
        { header: 'Seri No', key: 'serialNo' },
        { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
        { header: 'Notlar', key: 'notes' },
      ],
      'ekipmanlar',
    )
    showToast('success', 'Excel dışa aktarıldı')
  }

  function getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      'SFT (Solunum Fonksiyon)': '🫁', 'Odyometri': '🦻', 'EKG': '❤️',
      'Göz Muayene': '👁️', 'Röntgen / Radyoloji': '🩻', 'Ultrason': '📡',
      'Kan Tahlil Cihazı': '🩸', 'İdrar Tahlil Cihazı': '🧪', 'Psikoteknik': '🧠',
      'Diyetisyen': '🍎', 'Fizyoterapi': '💪', 'Genel Sağlık Kontrol': '🩺',
    }
    return map[type] || '🔧'
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
          <h2>Ekipmanlar</h2>
          <p className="content-subtitle">Taramalarda kullanılan cihaz ve ekipmanları yönetin</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Ekipman Ekle
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Ekipman ara (ad, tür, marka, seri no)..."
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
          {uniqueTypes.length > 0 && (
            <select className="filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
              <option value="">Tüm Türler</option>
              {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 240 }}>
                  Ekipman <SortArrow field="name" />
                </th>
                <th onClick={() => handleSort('type')} className="sortable">
                  Tür <SortArrow field="type" />
                </th>
                <th onClick={() => handleSort('brand')} className="sortable">
                  Marka <SortArrow field="brand" />
                </th>
                <th>Seri No</th>
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
                      {search || filterType || filterStatus !== 'all'
                        ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen ekipman bulunamadı</span></>
                        : <><Monitor size={24} strokeWidth={1.4} /><span>Henüz ekipman eklenmemiş</span></>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td><span className="cell-label">{e.type}</span></td>
                    <td><span className="cell-sub">{e.brand}</span></td>
                    <td><code className="test-code">{e.serialNo || '—'}</code></td>
                    <td>
                      <button
                        className={`status-badge ${e.status}`}
                        onClick={() => toggleStatus(e.id)}
                        title="Durumu değiştir"
                      >
                        {e.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="cell-action-btn edit" onClick={() => openEdit(e)} title="Düzenle">
                          <Edit3 size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn delete" onClick={() => setDeleteId(e.id)} title="Sil">
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
              {search || filterType || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen ekipman bulunamadı</span></>
                : <><Monitor size={24} strokeWidth={1.4} /><span>Henüz ekipman eklenmemiş</span></>
              }
            </div>
          ) : (
            paged.map((e) => (
              <div key={e.id} className="company-card">
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#eef2ff', color: '#4f6cf7', fontSize: '1.3rem', lineHeight: 1 }}>
                    {getTypeIcon(e.type)}
                  </div>
                  <button
                    className={`status-badge ${e.status}`}
                    onClick={() => toggleStatus(e.id)}
                    title="Durumu değiştir"
                  >
                    {e.status === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <div className="company-card-body">
                  <h4>{e.name}</h4>
                  <div className="company-card-meta">
                    <span><Tag size={12} strokeWidth={1.6} /> {e.type}</span>
                    <span><Monitor size={12} strokeWidth={1.6} /> {e.brand}</span>
                    {e.serialNo && <span><Hash size={12} strokeWidth={1.6} /> {e.serialNo}</span>}
                  </div>
                </div>
                <div className="company-card-footer">
                  {e.notes && <span className="company-card-stats"><FileText size={12} strokeWidth={1.6} /> {e.notes}</span>}
                  <div className="cell-actions" style={{ marginLeft: 'auto' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(e)} title="Düzenle">
                      <Edit3 size={15} strokeWidth={1.6} />
                    </button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(e.id)} title="Sil">
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
                <span className="header-icon"><Monitor size={14} strokeWidth={2} /></span>
                {editing ? 'Ekipman Düzenle' : 'Yeni Ekipman Ekle'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-section-card full">
                  <div className="card-header">Ekipman Bilgileri</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Ekipman Adı <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}>
                        <Monitor size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ekipman adı" autoFocus />
                      </div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Tür <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.type ? 'has-error' : ''}`}>
                        <Tag size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                          <option value="">Seçiniz</option>
                          {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      {formErrors.type && <span className="field-error">{formErrors.type}</span>}
                    </div>
                    <div className="field-group">
                      <label>Marka <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.brand ? 'has-error' : ''}`}>
                        <Monitor size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="Marka adı" />
                      </div>
                      {formErrors.brand && <span className="field-error">{formErrors.brand}</span>}
                    </div>
                    <div className="field-group">
                      <label>Seri No</label>
                      <div className="input-wrap">
                        <Hash size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formSerialNo} onChange={(e) => setFormSerialNo(e.target.value)} placeholder="Seri numarası" />
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
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Kalibrasyon, bakım notları..." rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Ekipman Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlertTriangle size={18} strokeWidth={1.6} style={{ color: '#ef4444', marginRight: 8 }} /> Ekipmanı Sil</h3>
            </div>
            <div className="modal-body">
              <p>
                <strong>{equipment.find((e) => e.id === deleteId)?.name}</strong> ekipmanını silmek istediğinize emin misiniz?
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

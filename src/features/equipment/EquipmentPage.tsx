import { useState, useRef, useMemo, useCallback } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Monitor, Plus, Search, X, Edit3, Trash2,
  FileText, Tag, Hash,
  CheckCircle, Check, LayoutList, LayoutGrid, FileSpreadsheet,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { SortArrow } from '../../components/SortArrow'
import { ToastBar } from '../../components/ToastBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { SortDir } from '../../hooks/useFilteredList'

interface Equipment {
  id: number; name: string; type: string; brand: string
  serialNo: string; notes: string; status: 'active' | 'passive'; createdAt: string
}

const EQUIPMENT_TYPES = [
  'SFT (Solunum Fonksiyon)', 'Odyometri', 'EKG', 'Göz Muayene',
  'Röntgen / Radyoloji', 'Ultrason', 'Kan Tahlil Cihazı',
  'İdrar Tahlil Cihazı', 'Psikoteknik', 'Diyetisyen',
  'Fizyoterapi', 'Genel Sağlık Kontrol',
]

const STORAGE_KEY = 'hantech_equipment'
type SortField = 'name' | 'type' | 'brand' | 'status'

const DEFAULT_EQUIPMENT: Equipment[] = [
  { id: 1, name: 'Spirolab III SFT Cihazı', type: 'SFT (Solunum Fonksiyon)', brand: 'MIR', serialNo: 'SPR-2024-001', notes: 'Yıllık kalibrasyon yapıldı', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Interacoustics AD629 Odyometre', type: 'Odyometri', brand: 'Interacoustics', serialNo: 'ODY-2024-002', notes: '', status: 'active', createdAt: '2024-02-10' },
  { id: 3, name: 'Nihon Kohden ECG-2150 EKG Cihazı', type: 'EKG', brand: 'Nihon Kohden', serialNo: 'EKG-2023-015', notes: '12 kanallı EKG', status: 'active', createdAt: '2023-11-20' },
  { id: 4, name: 'Topcon KR-8800 Otorefraktometre', type: 'Göz Muayene', brand: 'Topcon', serialNo: 'GOZ-2024-001', notes: 'Göz tarama cihazı', status: 'active', createdAt: '2024-03-05' },
  { id: 5, name: 'Siemens Multix Fusion Röntgen', type: 'Röntgen / Radyoloji', brand: 'Siemens', serialNo: 'RAD-2022-008', notes: 'Dijital röntgen cihazı', status: 'active', createdAt: '2022-06-01' },
  { id: 6, name: 'Mindray BC-3000 Kan Sayım Cihazı', type: 'Kan Tahlil Cihazı', brand: 'Mindray', serialNo: 'HEM-2024-003', notes: 'Tam kan sayımı için', status: 'active', createdAt: '2024-04-12' },
  { id: 7, name: 'Dirui H-500 İdrar Analiz Cihazı', type: 'İdrar Tahlil Cihazı', brand: 'Dirui', serialNo: 'IDR-2024-001', notes: '', status: 'active', createdAt: '2024-05-20' },
  { id: 8, name: 'GE Logiq F6 Ultrason', type: 'Ultrason', brand: 'GE Healthcare', serialNo: 'USG-2023-004', notes: 'Batın ultrasonu', status: 'passive', createdAt: '2023-08-15' },
]

export default function EquipmentPage() {
  const [equipment, setEquipment] = useLocalStorage(STORAGE_KEY, DEFAULT_EQUIPMENT)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [filterType, setFilterType] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailEquip, setDetailEquip] = useState<Equipment | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { toast, showToast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', type: '', brand: '', serialNo: '', notes: '', status: 'active' as 'active' | 'passive' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const updateForm = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const uniqueTypes = useMemo(() => [...new Set(equipment.map((e) => e.type))].sort(), [equipment])

  const filtered = useMemo(() => {
    return equipment
      .filter((e) => {
        if (filterStatus !== 'all' && e.status !== filterStatus) return false
        if (filterType && e.type !== filterType) return false
        if (!search) return true
        const q = search.toLowerCase()
        return e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.brand.toLowerCase().includes(q) || e.serialNo.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortField === 'name') return a.name.localeCompare(b.name) * dir
        if (sortField === 'type') return a.type.localeCompare(b.type) * dir
        if (sortField === 'brand') return a.brand.localeCompare(b.brand) * dir
        return a.status.localeCompare(b.status) * dir
      })
  }, [equipment, search, filterStatus, filterType, sortField, sortDir])

  const totalFiltered = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const openAdd = useCallback(() => {
    setEditing(null); setForm({ name: '', type: '', brand: '', serialNo: '', notes: '', status: 'active' }); setFormErrors({}); setShowModal(true)
  }, [])

  const openEdit = useCallback((e: Equipment) => {
    setEditing(e); setForm({ name: e.name, type: e.type, brand: e.brand, serialNo: e.serialNo, notes: e.notes, status: e.status }); setFormErrors({}); setShowModal(true)
  }, [])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Ekipman adı gerekli'
    if (!form.type) errors.type = 'Tür seçin'
    if (!form.brand.trim()) errors.brand = 'Marka gerekli'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    if (editing) {
      setEquipment((prev) => prev.map((e) => e.id === editing.id ? { ...e, ...form } : e))
      showToast('success', `"${form.name}" güncellendi`)
    } else {
      const newId = Math.max(...equipment.map((e) => e.id), 0) + 1
      setEquipment((prev) => [...prev, { id: newId, ...form, createdAt: new Date().toISOString().slice(0, 10) }])
      showToast('success', `"${form.name}" eklendi`)
    }
    setShowModal(false)
  }, [editing, form, validateForm, setEquipment, equipment, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    const name = equipment.find((e) => e.id === deleteId)?.name
    setEquipment((prev) => prev.filter((e) => e.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', `"${name}" silindi`)
  }, [deleteId, equipment, setEquipment, showToast])

  const toggleStatus = useCallback((id: number) => {
    setEquipment((prev) => prev.map((e) => {
      if (e.id !== id) return e
      const newStatus = e.status === 'active' ? 'passive' : 'active'
      showToast('success', `"${e.name}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
      return { ...e, status: newStatus }
    }))
  }, [setEquipment, showToast])

  const exportExcel = useCallback(() => {
    exportToExcel(equipment as unknown as Record<string, unknown>[], [
      { header: 'Ekipman Adı', key: 'name' }, { header: 'Tür', key: 'type' }, { header: 'Marka', key: 'brand' },
      { header: 'Seri No', key: 'serialNo' }, { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
      { header: 'Notlar', key: 'notes' },
    ], 'ekipmanlar')
    showToast('success', 'Excel dışa aktarıldı')
  }, [equipment, showToast])

  const getTypeIcon = useCallback((type: string): string => {
    const map: Record<string, string> = {
      'SFT (Solunum Fonksiyon)': '🫁', 'Odyometri': '🦻', 'EKG': '❤️',
      'Göz Muayene': '👁️', 'Röntgen / Radyoloji': '🩻', 'Ultrason': '📡',
      'Kan Tahlil Cihazı': '🩸', 'İdrar Tahlil Cihazı': '🧪', 'Psikoteknik': '🧠',
      'Diyetisyen': '🍎', 'Fizyoterapi': '💪', 'Genel Sağlık Kontrol': '🩺',
    }
    return map[type] || '🔧'
  }, [])

  const handlePageChange = useCallback((p: number) => setPage(p), [])
  const handlePerPageChange = useCallback((n: number) => { setPerPage(n); setPage(1) }, [])

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      <div className="content-top">
        <div><h2>Ekipmanlar</h2><p className="content-subtitle">Taramalarda kullanılan cihaz ve ekipmanları yönetin</p></div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} strokeWidth={2} /> Ekipman Ekle</button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input ref={searchRef} type="text" placeholder="Ekipman ara (ad, tür, marka, seri no)..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          {search && (<button className="table-search-clear" onClick={() => { setSearch(''); searchRef.current?.focus() }}><X size={14} strokeWidth={1.6} /></button>)}
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
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 240 }}>Ekipman <SortArrow field="name" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('type')} className="sortable">Tür <SortArrow field="type" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('brand')} className="sortable">Marka <SortArrow field="brand" sortField={sortField} sortDir={sortDir} /></th>
                <th>Seri No</th>
                <th onClick={() => handleSort('status')} className="sortable">Durum <SortArrow field="status" sortField={sortField} sortDir={sortDir} /></th>
                <th style={{ width: 90 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty">
                  {search || filterType || filterStatus !== 'all'
                    ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen ekipman bulunamadı</span></>
                    : <><Monitor size={24} strokeWidth={1.4} /><span>Henüz ekipman eklenmemiş</span></>}
                </div></td></tr>
              ) : (
                paged.map((e) => (
                  <tr key={e.id} className="clickable-row" onClick={() => setDetailEquip(e)}>
                    <td><strong>{e.name}</strong></td>
                    <td><span className="cell-label">{e.type}</span></td>
                    <td><span className="cell-sub">{e.brand}</span></td>
                    <td><code className="test-code">{e.serialNo || '\u2014'}</code></td>
                    <td><button className={`status-badge ${e.status}`} onClick={(e2) => { e2.stopPropagation(); toggleStatus(e.id) }} title="Durumu değiştir">{e.status === 'active' ? 'Aktif' : 'Pasif'}</button></td>
                    <td><div className="cell-actions" onClick={(e2) => e2.stopPropagation()}>
                      <button className="cell-action-btn edit" onClick={() => openEdit(e)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                      <button className="cell-action-btn delete" onClick={() => setDeleteId(e.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
              {search || filterType || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen ekipman bulunamadı</span></>
                : <><Monitor size={24} strokeWidth={1.4} /><span>Henüz ekipman eklenmemiş</span></>}
            </div>
          ) : (
            paged.map((e) => (
              <div key={e.id} className="company-card">
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#eef2ff', color: '#4f6cf7', fontSize: '1.3rem', lineHeight: 1 }}>{getTypeIcon(e.type)}</div>
                  <button className={`status-badge ${e.status}`} onClick={() => toggleStatus(e.id)} title="Durumu değiştir">{e.status === 'active' ? 'Aktif' : 'Pasif'}</button>
                </div>
                <div className="company-card-body" onClick={() => setDetailEquip(e)} style={{ cursor: 'pointer' }}>
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
                    <button className="cell-action-btn edit" onClick={() => openEdit(e)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(e.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
              <h3><span className="header-icon"><Monitor size={14} strokeWidth={2} /></span>{editing ? 'Ekipman Düzenle' : 'Yeni Ekipman Ekle'}</h3>
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
                        <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Ekipman adı" autoFocus /></div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Tür <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.type ? 'has-error' : ''}`}>
                        <Tag size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.type} onChange={(e) => updateForm('type', e.target.value)}>
                          <option value="">Seçiniz</option>
                          {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select></div>
                      {formErrors.type && <span className="field-error">{formErrors.type}</span>}
                    </div>
                    <div className="field-group">
                      <label>Marka <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.brand ? 'has-error' : ''}`}>
                        <Monitor size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} placeholder="Marka adı" /></div>
                      {formErrors.brand && <span className="field-error">{formErrors.brand}</span>}
                    </div>
                    <div className="field-group">
                      <label>Seri No</label>
                      <div className="input-wrap">
                        <Hash size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.serialNo} onChange={(e) => updateForm('serialNo', e.target.value)} placeholder="Seri numarası" /></div>
                    </div>
                    <div className="field-group">
                      <label>Durum</label>
                      <div className="input-wrap"><CheckCircle size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                          <option value="active">Aktif</option><option value="passive">Pasif</option>
                        </select></div>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Kalibrasyon, bakım notları..." rows={2} /></div>
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

      <ConfirmDialog open={deleteId !== null} title="Ekipmanı Sil"
        itemName={equipment.find((e) => e.id === deleteId)?.name || ''}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      {detailEquip && (
        <div className="modal-overlay" onClick={() => setDetailEquip(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg" style={{ background: '#eef2ff', color: '#4f6cf7' }}>
                  <Monitor size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <h3>{detailEquip.name}</h3>
                  <span className={`status-badge ${detailEquip.status}`} style={{ cursor: 'default' }}>{detailEquip.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailEquip(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-rows">
                <div className="detail-row"><span>Tip</span><strong>{detailEquip.type}</strong></div>
                <div className="detail-row"><span>Marka</span><strong>{detailEquip.brand}</strong></div>
                <div className="detail-row"><span>Seri No</span><strong>{detailEquip.serialNo || '\u2014'}</strong></div>
                <div className="detail-row"><span>Oluşturulma</span><strong>{detailEquip.createdAt}</strong></div>
              </div>
              {detailEquip.notes && (
                <div className="detail-section" style={{ marginTop: 12 }}>
                  <h4><FileText size={14} strokeWidth={1.8} /> Notlar</h4>
                  <p className="detail-notes">{detailEquip.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailEquip(null); openEdit(detailEquip) }}><Edit3 size={15} strokeWidth={1.6} /> Düzenle</button>
              <button className="btn btn-primary" onClick={() => setDetailEquip(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
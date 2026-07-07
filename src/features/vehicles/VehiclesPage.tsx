import { useState, useRef, useMemo, useCallback } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Truck, Plus, Search, X, Edit3, Trash2,
  FileText, Tag, Hash, Calendar,
  CheckCircle, Check, LayoutList, LayoutGrid, FileSpreadsheet, User,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { SortArrow } from '../../components/SortArrow'
import { ToastBar } from '../../components/ToastBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { SortDir } from '../../hooks/useFilteredList'

interface Vehicle {
  id: number; plate: string; name: string; brand: string; year: number
  driver: string; equipment: string; inspectionDate: string; maintenanceDate: string
  notes: string; status: 'active' | 'passive'; createdAt: string
}

const STORAGE_KEY = 'hantech_vehicles'
type SortField = 'plate' | 'name' | 'brand' | 'year' | 'inspectionDate' | 'maintenanceDate' | 'status'

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function DateCell({ date }: { date: string }) {
  const days = daysUntil(date)
  if (!date) return <span className="cell-sub">—</span>
  const isUrgent = days !== null && days <= 30
  const isSoon = days !== null && days <= 60
  return (
    <span className={`cell-date ${isUrgent ? 'date-urgent' : isSoon ? 'date-soon' : ''}`}>
      <Calendar size={12} strokeWidth={1.6} /> {date}
      {days !== null && (
        <span className="date-reminder">
          {days <= 0 ? ' (Süre geçti!)' : days <= 7 ? ` (${days} gün kaldı!)` : days <= 30 ? ` (${days} gün)` : ''}
        </span>
      )}
    </span>
  )
}

function getPersonnelNames(): string[] {
  try {
    const raw = localStorage.getItem('hantech_personnel')
    if (raw) {
      const list = JSON.parse(raw) as { name: string; status: string }[]
      return list.filter((p) => p.status === 'active').map((p) => p.name)
    }
  } catch { /* ignore */ }
  return []
}

const DEFAULT_VEHICLES: Vehicle[] = [
  { id: 1, plate: '34 ABC 123', name: 'Mobil Tarama Aracı 1', brand: 'Ford Transit', year: 2022, driver: 'Ahmet Yılmaz', equipment: 'SFT, Odyometri, EKG, Göz', inspectionDate: '2025-12-15', maintenanceDate: '2025-08-01', notes: 'Haftalık bakım yapıldı', status: 'active', createdAt: '2024-01-10' },
  { id: 2, plate: '34 DEF 456', name: 'Mobil Tarama Aracı 2', brand: 'Mercedes Sprinter', year: 2023, driver: 'Mehmet Demir', equipment: 'Röntgen, Ultrason, Kan Tahlil', inspectionDate: '2025-11-20', maintenanceDate: '2026-03-10', notes: '', status: 'active', createdAt: '2024-03-15' },
  { id: 3, plate: '35 GHI 789', name: 'İzmir Mobil Birim', brand: 'Volkswagen Crafter', year: 2021, driver: 'Ali Öztürk', equipment: 'SFT, Odyometri, EKG', inspectionDate: '2025-06-01', maintenanceDate: '2025-07-15', notes: 'İzmir bölgesinde görevli', status: 'active', createdAt: '2023-06-20' },
  { id: 4, plate: '16 JKL 012', name: 'Bursa Mobil Birim', brand: 'Fiat Ducato', year: 2020, driver: 'Fatma Yıldız', equipment: 'SFT, Odyometri, Göz, EKG', inspectionDate: '2025-03-01', maintenanceDate: '2025-09-20', notes: 'Periyodik bakım zamanı geldi', status: 'passive', createdAt: '2023-09-01' },
]

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useLocalStorage(STORAGE_KEY, DEFAULT_VEHICLES)
  const [personnelList] = useState<string[]>(getPersonnelNames)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { toast, showToast } = useToast(4000)
  const searchRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    plate: '', name: '', brand: '', year: new Date().getFullYear(), driver: '', equipment: '',
    inspectionDate: '', maintenanceDate: '', notes: '', status: 'active' as 'active' | 'passive',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const updateForm = useCallback((field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const filtered = useMemo(() => {
    return vehicles
      .filter((v) => {
        if (filterStatus !== 'all' && v.status !== filterStatus) return false
        if (!search) return true
        const q = search.toLowerCase()
        return v.plate.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q) || v.driver.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortField === 'plate') return a.plate.localeCompare(b.plate) * dir
        if (sortField === 'name') return a.name.localeCompare(b.name) * dir
        if (sortField === 'brand') return a.brand.localeCompare(b.brand) * dir
        if (sortField === 'year') return (a.year - b.year) * dir
        if (sortField === 'inspectionDate') return a.inspectionDate.localeCompare(b.inspectionDate) * dir
        if (sortField === 'maintenanceDate') return a.maintenanceDate.localeCompare(b.maintenanceDate) * dir
        return a.status.localeCompare(b.status) * dir
      })
  }, [vehicles, search, filterStatus, sortField, sortDir])

  const totalFiltered = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm({ plate: '', name: '', brand: '', year: new Date().getFullYear(), driver: '', equipment: '', inspectionDate: '', maintenanceDate: '', notes: '', status: 'active' })
    setFormErrors({}); setShowModal(true)
  }, [])

  const openEdit = useCallback((v: Vehicle) => {
    setEditing(v)
    setForm({ plate: v.plate, name: v.name, brand: v.brand, year: v.year, driver: v.driver, equipment: v.equipment, inspectionDate: v.inspectionDate, maintenanceDate: v.maintenanceDate, notes: v.notes, status: v.status })
    setFormErrors({}); setShowModal(true)
  }, [])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!form.plate.trim()) errors.plate = 'Plaka gerekli'
    if (!form.name.trim()) errors.name = 'Araç adı gerekli'
    if (!form.brand.trim()) errors.brand = 'Marka gerekli'
    if (!form.year || form.year < 2000) errors.year = 'Geçerli bir yıl girin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    if (editing) {
      setVehicles((prev) => prev.map((v) => v.id === editing.id ? { ...v, ...form } : v))
      showToast('success', `"${form.name}" güncellendi`)
    } else {
      const newId = Math.max(...vehicles.map((v) => v.id), 0) + 1
      setVehicles((prev) => [...prev, { id: newId, ...form, createdAt: new Date().toISOString().slice(0, 10) }])
      showToast('success', `"${form.name}" eklendi`)
    }
    setShowModal(false)
  }, [editing, form, validateForm, setVehicles, vehicles, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    const name = vehicles.find((v) => v.id === deleteId)?.name
    setVehicles((prev) => prev.filter((v) => v.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', `"${name}" silindi`)
  }, [deleteId, vehicles, setVehicles, showToast])

  const toggleStatus = useCallback((id: number) => {
    setVehicles((prev) => prev.map((v) => {
      if (v.id !== id) return v
      const newStatus = v.status === 'active' ? 'passive' : 'active'
      showToast('success', `"${v.name}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
      return { ...v, status: newStatus }
    }))
  }, [setVehicles, showToast])

  const exportExcel = useCallback(() => {
    exportToExcel(vehicles as unknown as Record<string, unknown>[], [
      { header: 'Plaka', key: 'plate' }, { header: 'Araç Adı', key: 'name' }, { header: 'Marka', key: 'brand' },
      { header: 'Yıl', key: 'year' }, { header: 'Sürücü', key: 'driver' }, { header: 'Ekipmanlar', key: 'equipment' },
      { header: 'Muayene Tarihi', key: 'inspectionDate' }, { header: 'Bakım Tarihi', key: 'maintenanceDate' },
      { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
      { header: 'Notlar', key: 'notes' },
    ], 'mobil-araclar')
    showToast('success', 'Excel dışa aktarıldı')
  }, [vehicles, showToast])

  const handlePageChange = useCallback((p: number) => setPage(p), [])
  const handlePerPageChange = useCallback((n: number) => { setPerPage(n); setPage(1) }, [])

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      <div className="content-top">
        <div><h2>Mobil Araçlar</h2><p className="content-subtitle">Gezici tarama araçlarını yönetin</p></div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} strokeWidth={2} /> Araç Ekle</button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input ref={searchRef} type="text" placeholder="Araç ara (plaka, ad, marka, sürücü)..."
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
                <th onClick={() => handleSort('plate')} className="sortable" style={{ minWidth: 120 }}>Plaka <SortArrow field="plate" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 180 }}>Araç Adı <SortArrow field="name" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('brand')} className="sortable">Marka <SortArrow field="brand" sortField={sortField} sortDir={sortDir} /></th>
                <th>Sürücü</th>
                <th onClick={() => handleSort('inspectionDate')} className="sortable">Muayene <SortArrow field="inspectionDate" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('maintenanceDate')} className="sortable">Bakım <SortArrow field="maintenanceDate" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('status')} className="sortable">Durum <SortArrow field="status" sortField={sortField} sortDir={sortDir} /></th>
                <th style={{ width: 90 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8}><div className="table-empty">
                  {search || filterStatus !== 'all'
                    ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen araç bulunamadı</span></>
                    : <><Truck size={24} strokeWidth={1.4} /><span>Henüz araç eklenmemiş</span></>}
                </div></td></tr>
              ) : (
                paged.map((v) => (
                  <tr key={v.id} className="clickable-row" onClick={() => setDetailVehicle(v)}>
                    <td><code className="test-code">{v.plate}</code></td>
                    <td><strong>{v.name}</strong></td>
                    <td><span className="cell-label">{v.brand}</span></td>
                    <td><span className="cell-sub"><User size={11} strokeWidth={1.6} /> {v.driver || '—'}</span></td>
                    <td><DateCell date={v.inspectionDate} /></td>
                    <td><DateCell date={v.maintenanceDate} /></td>
                    <td><button className={`status-badge ${v.status}`} onClick={(e2) => { e2.stopPropagation(); toggleStatus(v.id) }} title="Durumu değiştir">{v.status === 'active' ? 'Aktif' : 'Pasif'}</button></td>
                    <td><div className="cell-actions" onClick={(e2) => e2.stopPropagation()}>
                      <button className="cell-action-btn edit" onClick={() => openEdit(v)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                      <button className="cell-action-btn delete" onClick={() => setDeleteId(v.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen araç bulunamadı</span></>
                : <><Truck size={24} strokeWidth={1.4} /><span>Henüz araç eklenmemiş</span></>}
            </div>
          ) : (
            paged.map((v) => (
              <div key={v.id} className="company-card" style={{ borderTop: '3px solid var(--accent)' }}>
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#eef2ff', color: '#4f6cf7' }}><Truck size={18} strokeWidth={1.6} /></div>
                  <div><code className="test-code" style={{ fontSize: '0.85rem' }}>{v.plate}</code></div>
                  <button className={`status-badge ${v.status}`} onClick={() => toggleStatus(v.id)} style={{ marginLeft: 'auto' }}>{v.status === 'active' ? 'Aktif' : 'Pasif'}</button>
                </div>
                <div className="company-card-body" onClick={() => setDetailVehicle(v)} style={{ cursor: 'pointer' }}>
                  <h4>{v.name}</h4>
                  <div className="company-card-meta">
                    <span><Tag size={12} strokeWidth={1.6} /> {v.brand}</span>
                    {v.driver && <span><User size={12} strokeWidth={1.6} /> {v.driver}</span>}
                    {v.equipment && <span><FileText size={12} strokeWidth={1.6} /> {v.equipment}</span>}
                    {v.inspectionDate && <span><Calendar size={12} strokeWidth={1.6} /> Muayene: {v.inspectionDate}</span>}
                    {v.maintenanceDate && <span><Calendar size={12} strokeWidth={1.6} /> Bakım: {v.maintenanceDate}</span>}
                  </div>
                </div>
                <div className="company-card-footer">
                  {v.notes && <span className="company-card-stats">{v.notes}</span>}
                  <div className="cell-actions" style={{ marginLeft: 'auto' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(v)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(v.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="header-icon"><Truck size={14} strokeWidth={2} /></span>{editing ? 'Araç Düzenle' : 'Yeni Araç Ekle'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-section-card full">
                  <div className="card-header">Araç Bilgileri</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Araç Adı <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}><Truck size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Araç adı" autoFocus /></div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Plaka <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.plate ? 'has-error' : ''}`}><Hash size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.plate} onChange={(e) => updateForm('plate', e.target.value)} placeholder="34 ABC 123" /></div>
                      {formErrors.plate && <span className="field-error">{formErrors.plate}</span>}
                    </div>
                    <div className="field-group">
                      <label>Marka / Model <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.brand ? 'has-error' : ''}`}><Tag size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} placeholder="Ford Transit" /></div>
                      {formErrors.brand && <span className="field-error">{formErrors.brand}</span>}
                    </div>
                    <div className="field-group">
                      <label>Yıl <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.year ? 'has-error' : ''}`}><Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="number" value={form.year} onChange={(e) => updateForm('year', Number(e.target.value))} placeholder="2024" min={2000} max={2099} /></div>
                      {formErrors.year && <span className="field-error">{formErrors.year}</span>}
                    </div>
                    <div className="field-group">
                      <label>Sürücü</label>
                      <div className="input-wrap"><User size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.driver} onChange={(e) => updateForm('driver', e.target.value)}>
                          <option value="">Seçiniz</option>
                          {personnelList.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select></div>
                    </div>
                    <div className="field-group">
                      <label>Durum</label>
                      <div className="input-wrap"><CheckCircle size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                          <option value="active">Aktif</option><option value="passive">Pasif</option>
                        </select></div>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Ekipmanlar</label>
                      <div className="input-wrap"><FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.equipment} onChange={(e) => updateForm('equipment', e.target.value)} placeholder="SFT, Odyometri, EKG, Göz" /></div>
                    </div>
                    <div className="field-group">
                      <label>Muayene Tarihi</label>
                      <div className="input-wrap"><Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="date" value={form.inspectionDate} onChange={(e) => updateForm('inspectionDate', e.target.value)} /></div>
                    </div>
                    <div className="field-group">
                      <label>Bakım Tarihi</label>
                      <div className="input-wrap"><Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="date" value={form.maintenanceDate} onChange={(e) => updateForm('maintenanceDate', e.target.value)} /></div>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap"><FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Bakım, lokasyon notları..." rows={2} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Araç Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={deleteId !== null} title="Aracı Sil"
        itemName={vehicles.find((v) => v.id === deleteId)?.name || ''}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      {detailVehicle && (
        <div className="modal-overlay" onClick={() => setDetailVehicle(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg" style={{ background: '#eef2ff', color: '#4f6cf7' }}>
                  <Truck size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <h3>{detailVehicle.name}</h3>
                  <span className={`status-badge ${detailVehicle.status}`} style={{ cursor: 'default' }}>{detailVehicle.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailVehicle(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-rows">
                <div className="detail-row"><span>Plaka</span><strong>{detailVehicle.plate}</strong></div>
                <div className="detail-row"><span>Marka</span><strong>{detailVehicle.brand}</strong></div>
                <div className="detail-row"><span>Yıl</span><strong>{detailVehicle.year}</strong></div>
                <div className="detail-row"><span>Sürücü</span><strong>{detailVehicle.driver || '\u2014'}</strong></div>
                <div className="detail-row"><span>Ekipman</span><strong>{detailVehicle.equipment || '\u2014'}</strong></div>
                <div className="detail-row"><span>Muayene Tarihi</span><strong>{detailVehicle.inspectionDate || '\u2014'}</strong></div>
                <div className="detail-row"><span>Bakım Tarihi</span><strong>{detailVehicle.maintenanceDate || '\u2014'}</strong></div>
                <div className="detail-row"><span>Oluşturulma</span><strong>{detailVehicle.createdAt}</strong></div>
              </div>
              {detailVehicle.notes && (
                <div className="detail-section" style={{ marginTop: 12 }}>
                  <h4><FileText size={14} strokeWidth={1.8} /> Notlar</h4>
                  <p className="detail-notes">{detailVehicle.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailVehicle(null); openEdit(detailVehicle) }}><Edit3 size={15} strokeWidth={1.6} /> Düzenle</button>
              <button className="btn btn-primary" onClick={() => setDetailVehicle(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Truck, Plus, Search, X, Edit3, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, Tag, Hash, Calendar,
  CheckCircle, Check, ArrowUpDown, LayoutList, LayoutGrid, FileSpreadsheet, User,
} from 'lucide-react'

interface Vehicle {
  id: number
  plate: string
  name: string
  brand: string
  year: number
  driver: string
  equipment: string
  inspectionDate: string
  maintenanceDate: string
  notes: string
  status: 'active' | 'passive'
  createdAt: string
}

const PERSONNEL_KEY = 'hantech_personnel'

function getPersonnelNames(): string[] {
  try {
    const raw = localStorage.getItem(PERSONNEL_KEY)
    if (raw) {
      const list = JSON.parse(raw) as { name: string; status: string }[]
      return list.filter((p) => p.status === 'active').map((p) => p.name)
    }
  } catch { /* ignore */ }
  return []
}

const STORAGE_KEY = 'hantech_vehicles'

function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { id: 1, plate: '34 ABC 123', name: 'Mobil Tarama Aracı 1', brand: 'Ford Transit', year: 2022, driver: 'Ahmet Yılmaz', equipment: 'SFT, Odyometri, EKG, Göz', inspectionDate: '2025-12-15', maintenanceDate: '2025-08-01', notes: 'Haftalık bakım yapıldı', status: 'active', createdAt: '2024-01-10' },
    { id: 2, plate: '34 DEF 456', name: 'Mobil Tarama Aracı 2', brand: 'Mercedes Sprinter', year: 2023, driver: 'Mehmet Demir', equipment: 'Röntgen, Ultrason, Kan Tahlil', inspectionDate: '2025-11-20', maintenanceDate: '2026-03-10', notes: '', status: 'active', createdAt: '2024-03-15' },
    { id: 3, plate: '35 GHI 789', name: 'İzmir Mobil Birim', brand: 'Volkswagen Crafter', year: 2021, driver: 'Ali Öztürk', equipment: 'SFT, Odyometri, EKG', inspectionDate: '2025-06-01', maintenanceDate: '2025-07-15', notes: 'İzmir bölgesinde görevli', status: 'active', createdAt: '2023-06-20' },
    { id: 4, plate: '16 JKL 012', name: 'Bursa Mobil Birim', brand: 'Fiat Ducato', year: 2020, driver: 'Fatma Yıldız', equipment: 'SFT, Odyometri, Göz, EKG', inspectionDate: '2025-03-01', maintenanceDate: '2025-09-20', notes: 'Periyodik bakım zamanı geldi', status: 'passive', createdAt: '2023-09-01' },
  ]
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type SortField = 'plate' | 'name' | 'brand' | 'year' | 'inspectionDate' | 'maintenanceDate' | 'status'
type SortDir = 'asc' | 'desc'
type ToastType = 'success' | 'error'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(loadVehicles)
  const [personnelList, setPersonnelList] = useState<string[]>(getPersonnelNames)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [formPlate, setFormPlate] = useState('')
  const [formName, setFormName] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formYear, setFormYear] = useState(new Date().getFullYear())
  const [formDriver, setFormDriver] = useState('')
  const [formEquipment, setFormEquipment] = useState('')
  const [formInspectionDate, setFormInspectionDate] = useState('')
  const [formMaintenanceDate, setFormMaintenanceDate] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles))
  }, [vehicles])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    setPersonnelList(getPersonnelNames())
  }, [])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
  }

  const filtered = vehicles
    .filter((v) => {
      if (filterStatus !== 'all' && v.status !== filterStatus) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        v.plate.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q)
      )
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

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function openAdd() {
    setEditing(null)
    setFormPlate(''); setFormName(''); setFormBrand(''); setFormYear(new Date().getFullYear())
    setFormDriver(''); setFormEquipment(''); setFormInspectionDate(''); setFormMaintenanceDate('')
    setFormNotes(''); setFormStatus('active'); setFormErrors({}); setShowModal(true)
  }

  function openEdit(v: Vehicle) {
    setEditing(v)
    setFormPlate(v.plate); setFormName(v.name); setFormBrand(v.brand); setFormYear(v.year)
    setFormDriver(v.driver); setFormEquipment(v.equipment);
    setFormInspectionDate(v.inspectionDate); setFormMaintenanceDate(v.maintenanceDate)
    setFormNotes(v.notes); setFormStatus(v.status); setFormErrors({}); setShowModal(true)
    setPersonnelList(getPersonnelNames())
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!formPlate.trim()) errors.plate = 'Plaka gerekli'
    if (!formName.trim()) errors.name = 'Araç adı gerekli'
    if (!formBrand.trim()) errors.brand = 'Marka gerekli'
    if (!formYear || formYear < 2000) errors.year = 'Geçerli bir yıl girin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return
    if (editing) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === editing.id
            ? { ...v, plate: formPlate, name: formName, brand: formBrand, year: formYear, driver: formDriver, equipment: formEquipment, inspectionDate: formInspectionDate, maintenanceDate: formMaintenanceDate, notes: formNotes, status: formStatus }
            : v
        )
      )
      showToast('success', '"' + formName + '" güncellendi')
    } else {
      const newId = Math.max(...vehicles.map((v) => v.id), 0) + 1
      setVehicles((prev) => [
        ...prev,
        { id: newId, plate: formPlate, name: formName, brand: formBrand, year: formYear, driver: formDriver, equipment: formEquipment, inspectionDate: formInspectionDate, maintenanceDate: formMaintenanceDate, notes: formNotes, status: formStatus, createdAt: new Date().toISOString().slice(0, 10) },
      ])
      showToast('success', '"' + formName + '" eklendi')
    }
    setShowModal(false)
  }

  function handleDelete() {
    if (!deleteId) return
    const name = vehicles.find((v) => v.id === deleteId)?.name
    setVehicles((prev) => prev.filter((v) => v.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', '"' + name + '" silindi')
  }

  function toggleStatus(id: number) {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v
        const newStatus = v.status === 'active' ? 'passive' : 'active'
        showToast('success', '"' + v.name + '" ' + (newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'))
        return { ...v, status: newStatus as 'active' | 'passive' }
      })
    )
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

  function exportExcel() {
    exportToExcel(
      vehicles as unknown as Record<string, unknown>[],
      [
        { header: 'Plaka', key: 'plate' },
        { header: 'Araç Adı', key: 'name' },
        { header: 'Marka', key: 'brand' },
        { header: 'Yıl', key: 'year' },
        { header: 'Sürücü', key: 'driver' },
        { header: 'Ekipmanlar', key: 'equipment' },
        { header: 'Muayene Tarihi', key: 'inspectionDate' },
        { header: 'Bakım Tarihi', key: 'maintenanceDate' },
        { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
        { header: 'Notlar', key: 'notes' },
      ],
      'mobil-araclar',
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
          <h2>Mobil Araçlar</h2>
          <p className="content-subtitle">Gezici tarama araçlarını yönetin</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Araç Ekle
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Araç ara (plaka, ad, marka, sürücü)..."
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
                <th onClick={() => handleSort('plate')} className="sortable" style={{ minWidth: 120 }}>
                  Plaka <SortArrow field="plate" />
                </th>
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 180 }}>
                  Araç Adı <SortArrow field="name" />
                </th>
                <th onClick={() => handleSort('brand')} className="sortable">
                  Marka <SortArrow field="brand" />
                </th>
                <th>Sürücü</th>
                <th onClick={() => handleSort('inspectionDate')} className="sortable">
                  Muayene <SortArrow field="inspectionDate" />
                </th>
                <th onClick={() => handleSort('maintenanceDate')} className="sortable">
                  Bakım <SortArrow field="maintenanceDate" />
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
                  <td colSpan={8}>
                    <div className="table-empty">
                      {search || filterStatus !== 'all'
                        ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen araç bulunamadı</span></>
                        : <><Truck size={24} strokeWidth={1.4} /><span>Henüz araç eklenmemiş</span></>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((v) => (
                  <tr key={v.id}>
                    <td><code className="test-code">{v.plate}</code></td>
                    <td><strong>{v.name}</strong></td>
                    <td><span className="cell-label">{v.brand}</span></td>
                    <td><span className="cell-sub"><User size={11} strokeWidth={1.6} /> {v.driver || '—'}</span></td>
                    <td><DateCell date={v.inspectionDate} /></td>
                    <td><DateCell date={v.maintenanceDate} /></td>
                    <td>
                      <button
                        className={`status-badge ${v.status}`}
                        onClick={() => toggleStatus(v.id)}
                        title="Durumu değiştir"
                      >
                        {v.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="cell-action-btn edit" onClick={() => openEdit(v)} title="Düzenle">
                          <Edit3 size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn delete" onClick={() => setDeleteId(v.id)} title="Sil">
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
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen araç bulunamadı</span></>
                : <><Truck size={24} strokeWidth={1.4} /><span>Henüz araç eklenmemiş</span></>
              }
            </div>
          ) : (
            paged.map((v) => (
              <div key={v.id} className="company-card" style={{ borderTop: '3px solid var(--accent)' }}>
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#eef2ff', color: '#4f6cf7' }}>
                    <Truck size={18} strokeWidth={1.6} />
                  </div>
                  <div>
                    <code className="test-code" style={{ fontSize: '0.85rem' }}>{v.plate}</code>
                  </div>
                  <button
                    className={`status-badge ${v.status}`}
                    onClick={() => toggleStatus(v.id)}
                    title="Durumu değiştir"
                    style={{ marginLeft: 'auto' }}
                  >
                    {v.status === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <div className="company-card-body">
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
                    <button className="cell-action-btn edit" onClick={() => openEdit(v)} title="Düzenle">
                      <Edit3 size={15} strokeWidth={1.6} />
                    </button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(v.id)} title="Sil">
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="header-icon"><Truck size={14} strokeWidth={2} /></span>
                {editing ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-section-card full">
                  <div className="card-header">Araç Bilgileri</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Araç Adı <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}>
                        <Truck size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Araç adı" autoFocus />
                      </div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Plaka <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.plate ? 'has-error' : ''}`}>
                        <Hash size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formPlate} onChange={(e) => setFormPlate(e.target.value)} placeholder="34 ABC 123" />
                      </div>
                      {formErrors.plate && <span className="field-error">{formErrors.plate}</span>}
                    </div>
                    <div className="field-group">
                      <label>Marka / Model <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.brand ? 'has-error' : ''}`}>
                        <Tag size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="Ford Transit" />
                      </div>
                      {formErrors.brand && <span className="field-error">{formErrors.brand}</span>}
                    </div>
                    <div className="field-group">
                      <label>Yıl <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.year ? 'has-error' : ''}`}>
                        <Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="number" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} placeholder="2024" min={2000} max={2099} />
                      </div>
                      {formErrors.year && <span className="field-error">{formErrors.year}</span>}
                    </div>
                    <div className="field-group">
                      <label>Sürücü</label>
                      <div className="input-wrap">
                        <User size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formDriver} onChange={(e) => setFormDriver(e.target.value)}>
                          <option value="">Seçiniz</option>
                          {personnelList.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
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
                      <label>Ekipmanlar</label>
                      <div className="input-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formEquipment} onChange={(e) => setFormEquipment(e.target.value)} placeholder="SFT, Odyometri, EKG, Göz" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Muayene Tarihi</label>
                      <div className="input-wrap">
                        <Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="date" value={formInspectionDate} onChange={(e) => setFormInspectionDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Bakım Tarihi</label>
                      <div className="input-wrap">
                        <Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="date" value={formMaintenanceDate} onChange={(e) => setFormMaintenanceDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Bakım, lokasyon notları..." rows={2} />
                      </div>
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

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlertTriangle size={18} strokeWidth={1.6} style={{ color: '#ef4444', marginRight: 8 }} /> Aracı Sil</h3>
            </div>
            <div className="modal-body">
              <p>
                <strong>{vehicles.find((v) => v.id === deleteId)?.name}</strong> aracını silmek istediğinize emin misiniz?
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
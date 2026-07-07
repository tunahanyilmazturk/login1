import { useState, useRef, useMemo, useCallback } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Users, Plus, Search, X, Edit3, Trash2,
  Phone, Mail, FileText,
  CheckCircle, Calendar, User, Briefcase,
  Eye, Check, LayoutList, LayoutGrid, FileSpreadsheet,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { SortArrow } from '../../components/SortArrow'
import { ToastBar } from '../../components/ToastBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { SortDir } from '../../hooks/useFilteredList'

interface Personnel {
  id: number; name: string; role: string; phone: string; email: string
  startDate: string; notes: string; status: 'active' | 'passive'; createdAt: string
}

const ROLES = [
  'Müdür', 'Yönetici', 'Doktor', 'Hemşire',
  'Radyoloji Teknikeri', 'Odyometrist',
  'Laborant', 'Lab. Teknikeri', 'İş Güvenliği Uzmanı',
  'Fizyoterapist', 'Psikolog', 'Diyetisyen', 'Sekreter',
]

const STORAGE_KEY = 'hantech_personnel'
type SortField = 'name' | 'role' | 'startDate' | 'status'

const DEFAULT_PERSONNEL: Personnel[] = [
  { id: 1, name: 'Dr. Ali Yılmaz', role: 'Doktor', phone: '0532 111 2233', email: 'ali.yilmaz@hantech.com', startDate: '2025-01-15', notes: 'Başhekim', status: 'active', createdAt: '2025-01-10' },
  { id: 2, name: 'Ayşe Demir', role: 'Hemşire', phone: '0533 222 3344', email: 'ayse.demir@hantech.com', startDate: '2025-02-01', notes: '', status: 'active', createdAt: '2025-01-28' },
  { id: 3, name: 'Mehmet Kaya', role: 'Radyoloji Teknikeri', phone: '0535 333 4455', email: 'mehmet.kaya@hantech.com', startDate: '2025-03-10', notes: 'PA akciğer grafisi çekimi', status: 'active', createdAt: '2025-03-05' },
  { id: 4, name: 'Zeynep Çelik', role: 'Odyometrist', phone: '0536 444 5566', email: 'zeynep.celik@hantech.com', startDate: '2025-04-05', notes: 'Odyometri testleri', status: 'active', createdAt: '2025-03-28' },
  { id: 5, name: 'Fatma Yıldız', role: 'Laborant', phone: '0537 555 6677', email: 'fatma.yildiz@hantech.com', startDate: '2025-05-12', notes: 'Kan tahlilleri', status: 'active', createdAt: '2025-05-01' },
  { id: 6, name: 'Ahmet Şahin', role: 'Lab. Teknikeri', phone: '0538 666 7788', email: 'ahmet.sahin@hantech.com', startDate: '2025-06-01', notes: 'Tam idrar tahlili', status: 'passive', createdAt: '2025-05-20' },
  { id: 7, name: 'Mustafa Öztürk', role: 'Müdür', phone: '0539 777 8899', email: 'mustafa.ozturk@hantech.com', startDate: '2024-09-01', notes: 'Genel müdür', status: 'active', createdAt: '2024-08-20' },
  { id: 8, name: 'Elif Korkmaz', role: 'İş Güvenliği Uzmanı', phone: '0540 888 9900', email: 'elif.korkmaz@hantech.com', startDate: '2025-07-22', notes: 'A sınıfı iş güvenliği uzmanı', status: 'active', createdAt: '2025-07-10' },
]

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useLocalStorage(STORAGE_KEY, DEFAULT_PERSONNEL)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [filterRole, setFilterRole] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Personnel | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailPerson, setDetailPerson] = useState<Personnel | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { toast, showToast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', role: '', phone: '', email: '', startDate: '', notes: '',
    status: 'active' as 'active' | 'passive',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const updateForm = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const uniqueRoles = useMemo(() => [...new Set(personnel.map((p) => p.role))].sort(), [personnel])

  const filtered = useMemo(() => {
    return personnel
      .filter((p) => {
        if (filterStatus !== 'all' && p.status !== filterStatus) return false
        if (filterRole && p.role !== filterRole) return false
        if (!search) return true
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.phone.includes(q) || p.email.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortField === 'name') return a.name.localeCompare(b.name) * dir
        if (sortField === 'role') return a.role.localeCompare(b.role) * dir
        if (sortField === 'startDate') return a.startDate.localeCompare(b.startDate) * dir
        return a.status.localeCompare(b.status) * dir
      })
  }, [personnel, search, filterStatus, filterRole, sortField, sortDir])

  const totalFiltered = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm({ name: '', role: '', phone: '', email: '', startDate: '', notes: '', status: 'active' })
    setFormErrors({})
    setShowModal(true)
  }, [])

  const openEdit = useCallback((p: Personnel) => {
    setEditing(p)
    setForm({ name: p.name, role: p.role, phone: p.phone, email: p.email, startDate: p.startDate, notes: p.notes, status: p.status })
    setFormErrors({})
    setShowModal(true)
  }, [])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Personel adı gerekli'
    if (!form.role) errors.role = 'Görev seçin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    if (editing) {
      setPersonnel((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...form } : p))
      showToast('success', `"${form.name}" güncellendi`)
    } else {
      const newId = Math.max(...personnel.map((p) => p.id), 0) + 1
      setPersonnel((prev) => [...prev, { id: newId, ...form, createdAt: new Date().toISOString().slice(0, 10) }])
      showToast('success', `"${form.name}" eklendi`)
    }
    setShowModal(false)
  }, [editing, form, validateForm, setPersonnel, personnel, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    const name = personnel.find((p) => p.id === deleteId)?.name
    setPersonnel((prev) => prev.filter((p) => p.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', `"${name}" silindi`)
  }, [deleteId, personnel, setPersonnel, showToast])

  const toggleStatus = useCallback((id: number) => {
    setPersonnel((prev) => prev.map((p) => {
      if (p.id !== id) return p
      const newStatus = p.status === 'active' ? 'passive' : 'active'
      showToast('success', `"${p.name}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
      return { ...p, status: newStatus }
    }))
  }, [setPersonnel, showToast])

  const exportExcel = useCallback(() => {
    exportToExcel(
      personnel as unknown as Record<string, unknown>[],
      [
        { header: 'Ad Soyad', key: 'name' },
        { header: 'Görev', key: 'role' },
        { header: 'Telefon', key: 'phone' },
        { header: 'E-posta', key: 'email' },
        { header: 'Başlama Tarihi', key: 'startDate' },
        { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
        { header: 'Notlar', key: 'notes' },
      ],
      'personeller',
    )
    showToast('success', 'Excel dışa aktarıldı')
  }, [personnel, showToast])

  const getRoleColor = useCallback((role: string): string => {
    const colors: Record<string, string> = {
      'Müdür': '#8b5cf6', 'Yönetici': '#6366f1', 'Doktor': '#3b82f6',
      'Hemşire': '#ec4899', 'Radyoloji Teknikeri': '#06b6d4',
      'Odyometrist': '#14b8a6', 'Laborant': '#10b981',
      'Lab. Teknikeri': '#65a30d', 'İş Güvenliği Uzmanı': '#f59e0b',
      'Fizyoterapist': '#22d3ee', 'Psikolog': '#a855f7',
      'Diyetisyen': '#f97316', 'Sekreter': '#64748b',
    }
    return colors[role] || '#64748b'
  }, [])

  const handlePageChange = useCallback((p: number) => setPage(p), [])
  const handlePerPageChange = useCallback((n: number) => { setPerPage(n); setPage(1) }, [])

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      <div className="content-top">
        <div>
          <h2>Personeller</h2>
          <p className="content-subtitle">OSGB personel kayıtlarını yönetin</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Personel Ekle
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Personel ara (ad, görev, telefon, e-posta)..."
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
          {uniqueRoles.length > 0 && (
            <select className="filter-select" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1) }}>
              <option value="">Tüm Görevler</option>
              {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
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
            <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Tablo görünümü">
              <LayoutList size={15} strokeWidth={1.6} />
            </button>
            <button className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Kart görünümü">
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
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 200 }}>
                  Ad Soyad <SortArrow field="name" sortField={sortField} sortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('role')} className="sortable">
                  Görev <SortArrow field="role" sortField={sortField} sortDir={sortDir} />
                </th>
                <th>İletişim</th>
                <th onClick={() => handleSort('startDate')} className="sortable">
                  Başlama <SortArrow field="startDate" sortField={sortField} sortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Durum <SortArrow field="status" sortField={sortField} sortDir={sortDir} />
                </th>
                <th style={{ width: 90 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      {search || filterRole || filterStatus !== 'all'
                        ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen personel bulunamadı</span></>
                        : <><Users size={24} strokeWidth={1.4} /><span>Henüz personel eklenmemiş</span></>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="company-name-cell" onClick={() => setDetailPerson(p)} style={{ cursor: 'pointer' }}>
                        <div className="company-avatar-sm">{p.name.charAt(0)}</div>
                        <div><strong>{p.name}</strong></div>
                      </div>
                    </td>
                    <td>
                      <span className="sector-badge" style={{ background: getRoleColor(p.role) + '18', color: getRoleColor(p.role) }}>
                        {p.role}
                      </span>
                    </td>
                    <td>
                      <div className="cell-contact">
                        {p.phone && <span><Phone size={12} strokeWidth={1.6} /> {p.phone}</span>}
                        {p.email && <span><Mail size={12} strokeWidth={1.6} /> {p.email}</span>}
                        {!p.phone && !p.email && <span className="cell-sub">—</span>}
                      </div>
                    </td>
                    <td><span className="cell-date">{p.startDate ? <><Calendar size={12} strokeWidth={1.6} /> {p.startDate}</> : '—'}</span></td>
                    <td>
                      <button className={`status-badge ${p.status}`} onClick={() => toggleStatus(p.id)} title="Durumu değiştir">
                        {p.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="cell-action-btn view" onClick={() => setDetailPerson(p)} title="Detay"><Eye size={15} strokeWidth={1.6} /></button>
                        <button className="cell-action-btn edit" onClick={() => openEdit(p)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                        <button className="cell-action-btn delete" onClick={() => setDeleteId(p.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
              {search || filterRole || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen personel bulunamadı</span></>
                : <><Users size={24} strokeWidth={1.4} /><span>Henüz personel eklenmemiş</span></>
              }
            </div>
          ) : (
            paged.map((p) => (
              <div key={p.id} className="company-card">
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: getRoleColor(p.role) + '20', color: getRoleColor(p.role) }}>
                    {p.name.charAt(0)}
                  </div>
                  <button className={`status-badge ${p.status}`} onClick={() => toggleStatus(p.id)} title="Durumu değiştir">
                    {p.status === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <div className="company-card-body" onClick={() => setDetailPerson(p)} style={{ cursor: 'pointer' }}>
                  <h4>{p.name}</h4>
                  <span className="sector-badge" style={{ background: getRoleColor(p.role) + '18', color: getRoleColor(p.role), fontSize: '0.7rem' }}>
                    {p.role}
                  </span>
                  <div className="company-card-meta">
                    {p.phone && <span><Phone size={12} strokeWidth={1.6} /> {p.phone}</span>}
                    {p.email && <span><Mail size={12} strokeWidth={1.6} /> {p.email}</span>}
                  </div>
                </div>
                <div className="company-card-footer">
                  <div className="company-card-stats">
                    {p.startDate && <span><Calendar size={12} strokeWidth={1.6} /> {p.startDate}</span>}
                  </div>
                  <div className="cell-actions">
                    <button className="cell-action-btn edit" onClick={() => openEdit(p)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(p.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
              <h3><span className="header-icon"><Users size={14} strokeWidth={2} /></span>{editing ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-section-card full">
                  <div className="card-header">Personel Bilgileri</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group">
                      <label>Ad Soyad <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}>
                        <User size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Ad Soyad" autoFocus />
                      </div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Görev <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.role ? 'has-error' : ''}`}>
                        <Briefcase size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.role} onChange={(e) => updateForm('role', e.target.value)}>
                          <option value="">Seçiniz</option>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      {formErrors.role && <span className="field-error">{formErrors.role}</span>}
                    </div>
                    <div className="field-group">
                      <label>Telefon</label>
                      <div className="input-wrap">
                        <Phone size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="0xxx xxx xx xx" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>E-posta</label>
                      <div className="input-wrap">
                        <Mail size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="ornek@hantech.com" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>İşe Başlama Tarihi</label>
                      <div className="input-wrap">
                        <Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Durum</label>
                      <div className="input-wrap">
                        <CheckCircle size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                          <option value="active">Aktif</option>
                          <option value="passive">Pasif</option>
                        </select>
                      </div>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Personel hakkında notlar" rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Personel Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Personeli Sil"
        itemName={personnel.find((p) => p.id === deleteId)?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {detailPerson && (
        <div className="modal-overlay" onClick={() => setDetailPerson(null)}>
          <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg" style={{ background: getRoleColor(detailPerson.role) + '20', color: getRoleColor(detailPerson.role) }}>
                  {detailPerson.name.charAt(0)}
                </div>
                <div>
                  <h3>{detailPerson.name}</h3>
                  <span className={`status-badge ${detailPerson.status}`} style={{ cursor: 'default' }}>
                    {detailPerson.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailPerson(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4><User size={15} strokeWidth={1.8} /> Personel Bilgileri</h4>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Görev</span><strong>{detailPerson.role}</strong></div>
                    <div className="detail-row"><span>Telefon</span><strong>{detailPerson.phone || '—'}</strong></div>
                    <div className="detail-row"><span>E-posta</span><strong>{detailPerson.email || '—'}</strong></div>
                    <div className="detail-row"><span>Başlama Tarihi</span><strong>{detailPerson.startDate || '—'}</strong></div>
                  </div>
                </div>
                {detailPerson.notes && (
                  <div className="detail-section full">
                    <h4><FileText size={15} strokeWidth={1.8} /> Notlar</h4>
                    <p className="detail-notes">{detailPerson.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailPerson(null); openEdit(detailPerson) }}>
                <Edit3 size={15} strokeWidth={1.6} /> Düzenle
              </button>
              <button className="btn btn-primary" onClick={() => setDetailPerson(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
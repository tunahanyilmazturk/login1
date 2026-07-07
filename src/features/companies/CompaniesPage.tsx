import { useState, useRef, useEffect } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Building2, Plus, Search, X, Edit3, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Phone, Mail, FileText, AlertTriangle,
  CheckCircle, Calendar, Globe, ClipboardList, User,
  Eye, Check, ArrowUpDown, LayoutList, LayoutGrid, FileSpreadsheet,
} from 'lucide-react'

interface Company {
  id: number
  name: string
  sector: string
  authorizedPerson: string
  taxNo: string
  taxOffice: string
  phone: string
  email: string
  notes: string
  status: 'active' | 'passive'
  createdAt: string
  employeeCount: number
}

const SECTORS = [
  'İnşaat', 'Enerji', 'Lojistik', 'Gıda', 'Tekstil',
  'Madencilik', 'Turizm', 'Kimya', 'Otomotiv', 'Sağlık',
  'Bilişim', 'Savunma', 'Tarım', 'Eğitim', 'Diğer',
]

const STORAGE_KEY = 'hantech_companies'

function loadCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { id: 1, name: 'ABC İnşaat San. Tic. A.Ş.', sector: 'İnşaat', authorizedPerson: 'Ahmet Yılmaz', taxNo: '1234567890', taxOffice: 'Kadıköy', phone: '0212 555 0101', email: 'info@abcinsaat.com', notes: 'Uzun süreli OSGB hizmeti alınmaktadır.', status: 'active', createdAt: '2026-01-15', employeeCount: 45 },
    { id: 2, name: 'XYZ Enerji Üretim A.Ş.', sector: 'Enerji', authorizedPerson: 'Mehmet Demir', taxNo: '9876543210', taxOffice: 'Çankaya', phone: '0312 555 0202', email: 'iletisim@xyzenerji.com', notes: '', status: 'active', createdAt: '2026-02-20', employeeCount: 128 },
    { id: 3, name: 'Defne Lojistik Taşımacılık', sector: 'Lojistik', authorizedPerson: 'Ayşe Kaya', taxNo: '4567891230', taxOffice: 'Bornova', phone: '0232 555 0303', email: 'info@defnelojistik.com', notes: 'Pasif duruma alındı.', status: 'passive', createdAt: '2026-03-10', employeeCount: 23 },
    { id: 4, name: 'Mega Gıda Ürünleri Ltd. Şti.', sector: 'Gıda', authorizedPerson: 'Ali Öztürk', taxNo: '3216549870', taxOffice: 'Osmangazi', phone: '0224 555 0404', email: 'satis@megagida.com', notes: '', status: 'active', createdAt: '2026-04-05', employeeCount: 67 },
    { id: 5, name: 'Pınar Tekstil İhracat A.Ş.', sector: 'Tekstil', authorizedPerson: 'Zeynep Çelik', taxNo: '6543210987', taxOffice: 'Şişli', phone: '0212 555 0505', email: 'info@pinartekstil.com', notes: 'İhracat ağırlıklı çalışmaktadır.', status: 'active', createdAt: '2026-05-12', employeeCount: 312 },
    { id: 6, name: 'Yıldırım Madencilik Sanayi', sector: 'Madencilik', authorizedPerson: 'Mustafa Şahin', taxNo: '7890123456', taxOffice: 'Merkez', phone: '0332 555 0606', email: 'iletisim@yildirimmaden.com', notes: '', status: 'passive', createdAt: '2026-06-01', employeeCount: 89 },
    { id: 7, name: 'Doğa Turizm Seyahat Acentası', sector: 'Turizm', authorizedPerson: 'Fatma Yıldız', taxNo: '8901234567', taxOffice: 'Muratpaşa', phone: '0242 555 0707', email: 'info@dogaturizm.com', notes: 'Mevsimlik işçi bildirimleri düzenli.', status: 'active', createdAt: '2026-06-18', employeeCount: 15 },
    { id: 8, name: 'Güven Kimya Endüstrisi A.Ş.', sector: 'Kimya', authorizedPerson: 'İbrahim Aydın', taxNo: '9012345678', taxOffice: 'Gebze', phone: '0262 555 0808', email: 'info@guvenkimya.com', notes: 'Tehlikeli kimyasal üretim yapılmaktadır.', status: 'active', createdAt: '2026-07-22', employeeCount: 56 },
  ]
}

type SortField = 'name' | 'createdAt' | 'status' | 'employeeCount' | 'sector'
type SortDir = 'asc' | 'desc'

type ToastType = 'success' | 'error'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(loadCompanies)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [filterSector, setFilterSector] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailCompany, setDetailCompany] = useState<Company | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSector, setFormSector] = useState('')
  const [formTaxNo, setFormTaxNo] = useState('')
  const [formTaxOffice, setFormTaxOffice] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formAuthorizedPerson, setFormAuthorizedPerson] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formEmployeeCount, setFormEmployeeCount] = useState(0)
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Persist data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
  }, [companies])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
  }

  const filtered = companies
    .filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (filterSector && c.sector !== filterSector) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.taxNo.includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir
      if (sortField === 'sector') return a.sector.localeCompare(b.sector) * dir
      if (sortField === 'createdAt') return a.createdAt.localeCompare(b.createdAt) * dir
      if (sortField === 'employeeCount') return (a.employeeCount - b.employeeCount) * dir
      return a.status.localeCompare(b.status) * dir
    })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const uniqueSectors = [...new Set(companies.map((c) => c.sector))].sort()

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function openAdd() {
    setEditing(null)
    setFormName(''); setFormSector(''); setFormTaxNo(''); setFormTaxOffice('')
    setFormPhone(''); setFormEmail(''); setFormAuthorizedPerson(''); setFormNotes('')
    setFormEmployeeCount(0); setFormStatus('active'); setFormErrors({}); setShowModal(true)
  }

  function openEdit(c: Company) {
    setEditing(c)
    setFormName(c.name); setFormSector(c.sector); setFormTaxNo(c.taxNo); setFormTaxOffice(c.taxOffice)
    setFormPhone(c.phone); setFormEmail(c.email); setFormAuthorizedPerson(c.authorizedPerson); setFormNotes(c.notes)
    setFormEmployeeCount(c.employeeCount); setFormStatus(c.status); setFormErrors({}); setShowModal(true)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!formName.trim()) errors.name = 'Firma adı gerekli'
    if (!formSector) errors.sector = 'Sektör seçin'
    if (!formPhone.trim()) errors.phone = 'Telefon gerekli'
    if (!formEmail.trim()) errors.email = 'E-posta gerekli'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Geçerli bir e-posta girin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return
    if (editing) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? { ...c, name: formName, sector: formSector, taxNo: formTaxNo, taxOffice: formTaxOffice, phone: formPhone, email: formEmail, authorizedPerson: formAuthorizedPerson, notes: formNotes, status: formStatus, employeeCount: formEmployeeCount }
            : c
        )
      )
      showToast('success', '"' + formName + '" güncellendi')
    } else {
      const newId = Math.max(...companies.map((c) => c.id), 0) + 1
      setCompanies((prev) => [
        ...prev,
        { id: newId, name: formName, sector: formSector, taxNo: formTaxNo, taxOffice: formTaxOffice, phone: formPhone, email: formEmail, authorizedPerson: formAuthorizedPerson, notes: formNotes, status: formStatus, createdAt: new Date().toISOString().slice(0, 10), employeeCount: formEmployeeCount },
      ])
      showToast('success', '"' + formName + '" eklendi')
    }
    setShowModal(false)
  }

  function handleDelete() {
    if (!deleteId) return
    const name = companies.find((c) => c.id === deleteId)?.name
    setCompanies((prev) => prev.filter((c) => c.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', '"' + name + '" silindi')
  }

  function toggleStatus(id: number) {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const newStatus = c.status === 'active' ? 'passive' : 'active'
        showToast('success', '"' + c.name + '" ' + (newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'))
        return { ...c, status: newStatus as 'active' | 'passive' }
      })
    )
  }

  function exportExcel() {
    exportToExcel(
      companies as unknown as Record<string, unknown>[],
      [
        { header: 'Firma Adı', key: 'name' },
        { header: 'Yetkili', key: 'authorizedPerson' },
        { header: 'Sektör', key: 'sector' },
        { header: 'Vergi No', key: 'taxNo' },
        { header: 'Vergi Dairesi', key: 'taxOffice' },
        { header: 'Telefon', key: 'phone' },
        { header: 'E-posta', key: 'email' },
        { header: 'Notlar', key: 'notes' },
        { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
        { header: 'Çalışan Sayısı', key: 'employeeCount' },
        { header: 'Kayıt Tarihi', key: 'createdAt' },
      ],
      'firmalar',
    )
    showToast('success', 'Excel dışa aktarıldı')
  }

  function getSectorColor(sector: string): string {
    const colors: Record<string, string> = {
      'İnşaat': '#3b82f6', 'Enerji': '#f59e0b', 'Lojistik': '#8b5cf6',
      'Gıda': '#10b981', 'Tekstil': '#ec4899', 'Madencilik': '#f97316',
      'Turizm': '#14b8a6', 'Kimya': '#ef4444', 'Otomotiv': '#6366f1',
      'Sağlık': '#22d3ee', 'Bilişim': '#06b6d4', 'Savunma': '#1e40af',
      'Tarım': '#65a30d', 'Eğitim': '#a855f7',
    }
    return colors[sector] || '#64748b'
  }

  function SortArrow({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} strokeWidth={1.6} className="sort-arrow-idle" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} strokeWidth={2} className="sort-arrow" />
      : <ChevronDown size={13} strokeWidth={2} className="sort-arrow" />
  }

  return (
    <div className="page-content">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} strokeWidth={2} /> : <AlertTriangle size={16} strokeWidth={2} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="content-top">
        <div>
          <h2>Firmalar</h2>
          <p className="content-subtitle">Tüm firma kayıtlarını yönetin</p>
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} /> Firma Ekle
          </button>
        </div>
      </div>

      {/* Search, Filter & View Toggle */}
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Firma ara (ad, sektör, vergi no, telefon, e-posta)..."
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
          {uniqueSectors.length > 0 && (
            <select className="filter-select" value={filterSector} onChange={(e) => { setFilterSector(e.target.value); setPage(1) }}>
              <option value="">Tüm Sektörler</option>
              {uniqueSectors.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable" style={{ minWidth: 220 }}>
                  Firma Adı <SortArrow field="name" />
                </th>
                <th onClick={() => handleSort('sector')} className="sortable">
                  Sektör <SortArrow field="sector" />
                </th>
                <th>Vergi No / Dairesi</th>
                <th>İletişim</th>
                <th onClick={() => handleSort('employeeCount')} className="sortable">
                  Çalışan <SortArrow field="employeeCount" />
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Durum <SortArrow field="status" />
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  Kayıt <SortArrow field="createdAt" />
                </th>
                <th style={{ width: 90 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="table-empty">
                      {search || filterSector || filterStatus !== 'all'
                        ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen firma bulunamadı</span></>
                        : <><Building2 size={24} strokeWidth={1.4} /><span>Henüz firma eklenmemiş</span></>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id}>
                    <td>
                        <div className="company-name-cell" onClick={() => setDetailCompany(c)} style={{ cursor: 'pointer' }}>
                          <div className="company-avatar-sm">{c.name.charAt(0)}</div>
                          <div>
                            <strong>{c.name}</strong>
                            {c.authorizedPerson && <span className="company-address-preview"><User size={11} strokeWidth={1.6} /> {c.authorizedPerson}</span>}
                          </div>
                        </div>
                    </td>
                    <td>
                      <span className="sector-badge" style={{ background: getSectorColor(c.sector) + '18', color: getSectorColor(c.sector) }}>
                        {c.sector}
                      </span>
                    </td>
                    <td>
                      <span className="cell-label">{c.taxNo}</span>
                      <span className="cell-sub">{c.taxOffice}</span>
                    </td>
                    <td>
                      <div className="cell-contact">
                        <span><Phone size={12} strokeWidth={1.6} /> {c.phone}</span>
                        <span><Mail size={12} strokeWidth={1.6} /> {c.email}</span>
                      </div>
                    </td>
                    <td><span className="cell-number">{c.employeeCount}</span></td>
                    <td>
                      <button
                        className={`status-badge ${c.status}`}
                        onClick={() => toggleStatus(c.id)}
                        title="Durumu değiştir"
                      >
                        {c.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td><span className="cell-date"><Calendar size={12} strokeWidth={1.6} /> {c.createdAt}</span></td>
                    <td>
                      <div className="cell-actions">
                        <button className="cell-action-btn view" onClick={() => setDetailCompany(c)} title="Detay">
                          <Eye size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn edit" onClick={() => openEdit(c)} title="Düzenle">
                          <Edit3 size={15} strokeWidth={1.6} />
                        </button>
                        <button className="cell-action-btn delete" onClick={() => setDeleteId(c.id)} title="Sil">
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

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="company-cards">
          {paged.length === 0 ? (
            <div className="table-empty" style={{ gridColumn: '1 / -1' }}>
              {search || filterSector || filterStatus !== 'all'
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen firma bulunamadı</span></>
                : <><Building2 size={24} strokeWidth={1.4} /><span>Henüz firma eklenmemiş</span></>
              }
            </div>
          ) : (
            paged.map((c) => (
              <div key={c.id} className="company-card">
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: getSectorColor(c.sector) + '20', color: getSectorColor(c.sector) }}>
                    {c.name.charAt(0)}
                  </div>
                  <button
                    className={`status-badge ${c.status}`}
                    onClick={() => toggleStatus(c.id)}
                    title="Durumu değiştir"
                  >
                    {c.status === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <div className="company-card-body" onClick={() => setDetailCompany(c)} style={{ cursor: 'pointer' }}>
                  <h4>{c.name}</h4>
                  <span className="sector-badge" style={{ background: getSectorColor(c.sector) + '18', color: getSectorColor(c.sector), fontSize: '0.7rem' }}>
                    {c.sector}
                  </span>
                  <div className="company-card-meta">
                    <span><User size={12} strokeWidth={1.6} /> {c.authorizedPerson || 'Yetkili belirtilmemiş'}</span>
                    <span><Phone size={12} strokeWidth={1.6} /> {c.phone}</span>
                    <span><Mail size={12} strokeWidth={1.6} /> {c.email}</span>
                    <span><FileText size={12} strokeWidth={1.6} /> {c.taxNo} / {c.taxOffice}</span>
                  </div>
                </div>
                <div className="company-card-footer">
                  <div className="company-card-stats">
                    <span><strong>{c.employeeCount}</strong> Çalışan</span>
                    <span><Calendar size={12} strokeWidth={1.6} /> {c.createdAt}</span>
                  </div>
                  <div className="cell-actions">
                    <button className="cell-action-btn edit" onClick={() => openEdit(c)} title="Düzenle">
                      <Edit3 size={15} strokeWidth={1.6} />
                    </button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(c.id)} title="Sil">
                      <Trash2 size={15} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-left">
          <span className="pagination-info">Toplam {filtered.length} kayıt</span>
          <select className="per-page-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}>
            <option value={5}>5 / sayfa</option>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="header-icon"><Building2 size={14} strokeWidth={2} /></span>
                {editing ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {/* Firma Bilgileri */}
                <div className="form-section-card">
                  <div className="card-header">Firma Bilgileri</div>
                  <div className="card-body">
                    <div className="field-group">
                      <label>Firma Adı <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.name ? 'has-error' : ''}`}>
                        <Building2 size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Firma unvanı" autoFocus />
                      </div>
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>
                    <div className="field-group">
                      <label>Yetkili Ad Soyad</label>
                      <div className="input-wrap">
                        <User size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formAuthorizedPerson} onChange={(e) => setFormAuthorizedPerson(e.target.value)} placeholder="Ad Soyad" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Sektör <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.sector ? 'has-error' : ''}`}>
                        <Globe size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formSector} onChange={(e) => setFormSector(e.target.value)}>
                          <option value="">Seçiniz</option>
                          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {formErrors.sector && <span className="field-error">{formErrors.sector}</span>}
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

                {/* Vergi Bilgileri */}
                <div className="form-section-card">
                  <div className="card-header">Vergi Bilgileri</div>
                  <div className="card-body">
                    <div className="field-group">
                      <label>Vergi No</label>
                      <div className={`input-wrap ${formErrors.taxNo ? 'has-error' : ''}`}>
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formTaxNo} onChange={(e) => setFormTaxNo(e.target.value)} placeholder="10 hane" maxLength={10} />
                      </div>
                      {formErrors.taxNo && <span className="field-error">{formErrors.taxNo}</span>}
                    </div>
                    <div className="field-group">
                      <label>Vergi Dairesi</label>
                      <div className="input-wrap">
                        <FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formTaxOffice} onChange={(e) => setFormTaxOffice(e.target.value)} placeholder="Vergi dairesi" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Çalışan Sayısı</label>
                      <div className="input-wrap">
                        <Building2 size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="number" value={formEmployeeCount} onChange={(e) => setFormEmployeeCount(Math.max(0, Number(e.target.value)))} placeholder="0" min={0} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* İletişim */}
                <div className="form-section-card">
                  <div className="card-header">İletişim</div>
                  <div className="card-body">
                    <div className="field-group">
                      <label>Telefon <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.phone ? 'has-error' : ''}`}>
                        <Phone size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0xxx xxx xx xx" />
                      </div>
                      {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                    </div>
                    <div className="field-group">
                      <label>E-posta <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.email ? 'has-error' : ''}`}>
                        <Mail size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="ornek@firma.com" />
                      </div>
                      {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                    </div>
                    <div className="field-group">
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap">
                        <ClipboardList size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Firma hakkında notlar" rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Firma Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlertTriangle size={18} strokeWidth={1.6} style={{ color: '#ef4444', marginRight: 8 }} /> Firmayı Sil</h3>
            </div>
            <div className="modal-body">
              <p>
                <strong>{companies.find((c) => c.id === deleteId)?.name}</strong> firmasını silmek istediğinize emin misiniz?
              </p>
              <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Bu işlem geri alınamaz. Firma ve ilişkili tüm veriler kalıcı olarak silinecektir.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>İptal</button>
              <button className="btn btn-danger" onClick={handleDelete}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailCompany && (
        <div className="modal-overlay" onClick={() => setDetailCompany(null)}>
          <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg">{detailCompany.name.charAt(0)}</div>
                <div>
                  <h3>{detailCompany.name}</h3>
                  <span className={`status-badge ${detailCompany.status}`} style={{ cursor: 'default' }}>
                    {detailCompany.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailCompany(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4><FileText size={15} strokeWidth={1.8} /> Firma Bilgileri</h4>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Yetkili</span><strong>{detailCompany.authorizedPerson || '—'}</strong></div>
                    <div className="detail-row"><span>Sektör</span><strong>{detailCompany.sector}</strong></div>
                    <div className="detail-row"><span>Çalışan Sayısı</span><strong>{detailCompany.employeeCount}</strong></div>
                    <div className="detail-row"><span>Kayıt Tarihi</span><strong>{detailCompany.createdAt}</strong></div>
                  </div>
                </div>
                <div className="detail-section">
                  <h4><Phone size={15} strokeWidth={1.8} /> İletişim</h4>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Telefon</span><strong>{detailCompany.phone}</strong></div>
                    <div className="detail-row"><span>E-posta</span><strong>{detailCompany.email}</strong></div>
                    <div className="detail-row"><span>Vergi No</span><strong>{detailCompany.taxNo || '—'}</strong></div>
                    <div className="detail-row"><span>Vergi Dairesi</span><strong>{detailCompany.taxOffice || '—'}</strong></div>
                  </div>
                </div>
                {detailCompany.notes && (
                  <div className="detail-section full">
                    <h4><ClipboardList size={15} strokeWidth={1.8} /> Notlar</h4>
                    <p className="detail-notes">{detailCompany.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailCompany(null); openEdit(detailCompany) }}>
                <Edit3 size={15} strokeWidth={1.6} /> Düzenle
              </button>
              <button className="btn btn-primary" onClick={() => setDetailCompany(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

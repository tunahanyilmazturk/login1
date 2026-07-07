import { useState, useRef, useMemo, useCallback } from 'react'
import { exportToExcel } from '../../utils/exportToExcel'
import {
  Stethoscope, Plus, Search, X, Edit3, Trash2,
  FileText, Building2, FlaskConical, Calendar,
  CheckCircle, Check, FileSpreadsheet, LayoutList, LayoutGrid,
  User, Truck,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { SortArrow } from '../../components/SortArrow'
import { ToastBar } from '../../components/ToastBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { SortDir } from '../../hooks/useFilteredList'

interface ScanPersonnel { name: string; role: string }
interface ScanTest { code: string; name: string; category: string }

interface Scan {
  id: number; scanNo: string; companyName: string; vehicle: string
  personnel: ScanPersonnel[]; tests: ScanTest[]
  scanDate: string; notes: string; status: 'active' | 'passive'; createdAt: string
}

const STORAGE_KEY = 'hantech_scans'
type SortField = 'scanNo' | 'companyName' | 'scanDate' | 'status'

function getCompanies(): { name: string }[] {
  try { const raw = localStorage.getItem('hantech_companies'); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return []
}
function getPersonnel(): { name: string; role: string; status: string }[] {
  try { const raw = localStorage.getItem('hantech_personnel'); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return []
}
function getTests(): { code: string; name: string; category: string; status: string }[] {
  try {
    const raw = localStorage.getItem('hantech_tests')
    if (raw) return JSON.parse(raw)
    const defaults = [
      { code: 'HEM-001', name: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji', status: 'active' },
      { code: 'BIY-001', name: 'Açlık Kan Şekeri', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-003', name: 'Total Kolesterol', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-004', name: 'HDL - LDL Kolesterol', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-005', name: 'Trigliserit', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-006', name: 'ALT (SGPT)', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-007', name: 'AST (SGOT)', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-008', name: 'Kreatinin', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-009', name: 'Üre', category: 'Biyokimya', status: 'active' },
      { code: 'BIY-010', name: 'Ürik Asit', category: 'Biyokimya', status: 'active' },
      { code: 'RAD-001', name: 'PA Akciğer Grafisi', category: 'Radyoloji', status: 'active' },
      { code: 'ODY-001', name: 'Odyometri Testi', category: 'Odyometri', status: 'active' },
      { code: 'EKG-001', name: 'Elektrokardiyografi', category: 'EKG', status: 'active' },
      { code: 'SPR-001', name: 'Spirometri (Solunum Fonksiyon)', category: 'Spirometri', status: 'active' },
      { code: 'GEN-001', name: 'İdrar Tahlili (Tam İdrar)', category: 'Genel Sağlık', status: 'active' },
    ]
    localStorage.setItem('hantech_tests', JSON.stringify(defaults))
    return defaults
  } catch { return [] }
}
function getVehicles(): { name: string; plate: string; status: string }[] {
  try { const raw = localStorage.getItem('hantech_vehicles'); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return []
}
function nextScanNo(existing: Scan[]): string {
  const max = existing.reduce((max, s) => {
    const num = parseInt(s.scanNo.replace('TRM-', ''), 10)
    return isNaN(num) ? max : Math.max(max, num)
  }, 0)
  return 'TRM-' + String(max + 1).padStart(4, '0')
}

const SEED_SCANS: Scan[] = [
  { id: 1, scanNo: 'TRM-0001', companyName: 'ABC İnşaat San. Tic. A.Ş.', vehicle: '34 ABC 123', personnel: [{ name: 'Ahmet Yılmaz', role: 'İş Güvenliği Uzmanı' }, { name: 'Mehmet Demir', role: 'Saha Sorumlusu' }], tests: [{ code: 'HEM-001', name: 'Tam Kan Sayımı (Hemogram)', category: 'Hematoloji' }, { code: 'EKG-001', name: 'Elektrokardiyografi', category: 'EKG' }], scanDate: '2026-06-15', notes: 'Şantiye alanı rutin tarama.', status: 'active', createdAt: '2026-06-14' },
  { id: 2, scanNo: 'TRM-0002', companyName: 'XYZ Enerji Üretim A.Ş.', vehicle: '06 XYZ 789', personnel: [{ name: 'Ayşe Kaya', role: 'İş Güvenliği Uzmanı' }, { name: 'Fatma Yıldız', role: 'Sağlık Personeli' }, { name: 'Ali Öztürk', role: 'Saha Sorumlusu' }], tests: [{ code: 'BIY-001', name: 'Açlık Kan Şekeri', category: 'Biyokimya' }, { code: 'BIY-003', name: 'Total Kolesterol', category: 'Biyokimya' }, { code: 'RAD-001', name: 'PA Akciğer Grafisi', category: 'Radyoloji' }], scanDate: '2026-06-20', notes: 'Santral sahası periyodik tarama.', status: 'active', createdAt: '2026-06-18' },
  { id: 3, scanNo: 'TRM-0003', companyName: 'Mega Gıda Ürünleri Ltd. Şti.', vehicle: '16 MEGA 01', personnel: [{ name: 'Zeynep Çelik', role: 'İş Güvenliği Uzmanı' }], tests: [{ code: 'SPR-001', name: 'Spirometri (Solunum Fonksiyon)', category: 'Spirometri' }, { code: 'ODY-001', name: 'Odyometri Testi', category: 'Odyometri' }], scanDate: '2026-06-25', notes: 'Üretim bandı taraması.', status: 'active', createdAt: '2026-06-23' },
  { id: 4, scanNo: 'TRM-0004', companyName: 'Pınar Tekstil İhracat A.Ş.', vehicle: '34 PIN 456', personnel: [{ name: 'Mustafa Şahin', role: 'İş Güvenliği Uzmanı' }, { name: 'İbrahim Aydın', role: 'Saha Sorumlusu' }], tests: [{ code: 'GEN-001', name: 'İdrar Tahlili (Tam İdrar)', category: 'Genel Sağlık' }, { code: 'EKG-001', name: 'Elektrokardiyografi', category: 'EKG' }], scanDate: '2026-07-02', notes: 'Atölye ve ofis alanları.', status: 'active', createdAt: '2026-06-30' },
  { id: 5, scanNo: 'TRM-0005', companyName: 'Defne Lojistik Taşımacılık', vehicle: '35 DLK 789', personnel: [{ name: 'Ahmet Yılmaz', role: 'İş Güvenliği Uzmanı' }], tests: [{ code: 'BIY-006', name: 'ALT (SGPT)', category: 'Biyokimya' }], scanDate: '2026-07-08', notes: 'Araç filosu taraması.', status: 'passive', createdAt: '2026-07-05' },
  { id: 6, scanNo: 'TRM-0006', companyName: 'Güven Kimya Endüstrisi A.Ş.', vehicle: '41 KMY 123', personnel: [{ name: 'Fatma Yıldız', role: 'Sağlık Personeli' }, { name: 'Ayşe Kaya', role: 'İş Güvenliği Uzmanı' }], tests: [{ code: 'BIY-008', name: 'Kreatinin', category: 'Biyokimya' }, { code: 'BIY-009', name: 'Üre', category: 'Biyokimya' }, { code: 'BIY-010', name: 'Ürik Asit', category: 'Biyokimya' }], scanDate: '2026-07-14', notes: 'Tehlikeli madde depolama taraması.', status: 'active', createdAt: '2026-07-12' },
]

export default function ScansPage() {
  const [scans, setScans] = useLocalStorage(STORAGE_KEY, SEED_SCANS)
  const [companies] = useState(getCompanies)
  const [allPersonnel, setAllPersonnel] = useState(getPersonnel)
  const [allTests, setAllTests] = useState(getTests)
  const [allVehicles] = useState(getVehicles)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')
  const [sortField, setSortField] = useState<SortField>('scanDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Scan | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [detailScan, setDetailScan] = useState<Scan | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const { toast, showToast } = useToast(3000)
  const searchRef = useRef<HTMLInputElement>(null)

  const [formCompany, setFormCompany] = useState('')
  const [formVehicle, setFormVehicle] = useState('')
  const [formPersonnel, setFormPersonnel] = useState<ScanPersonnel[]>([])
  const [formTests, setFormTests] = useState<ScanTest[]>([])
  const [formScanDate, setFormScanDate] = useState(new Date().toISOString().slice(0, 10))
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'passive'>('active')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedPersonnel, setSelectedPersonnel] = useState('')
  const [selectedTest, setSelectedTest] = useState('')

  const filtered = useMemo(() => {
    return scans
      .filter((s) => {
        if (filterStatus !== 'all' && s.status !== filterStatus) return false
        if (!search) return true
        const q = search.toLowerCase()
        return s.scanNo.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (sortField === 'scanNo') return a.scanNo.localeCompare(b.scanNo) * dir
        if (sortField === 'companyName') return a.companyName.localeCompare(b.companyName) * dir
        if (sortField === 'scanDate') return a.scanDate.localeCompare(b.scanDate) * dir
        return a.status.localeCompare(b.status) * dir
      })
  }, [scans, search, filterStatus, sortField, sortDir])

  const totalFiltered = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const openAdd = useCallback(() => {
    setEditing(null); setFormCompany(''); setFormVehicle(''); setFormPersonnel([]); setFormTests([])
    setFormScanDate(new Date().toISOString().slice(0, 10)); setFormNotes(''); setFormStatus('active'); setFormErrors({}); setShowModal(true)
    setAllPersonnel(getPersonnel()); setAllTests(getTests())
  }, [])

  const openEdit = useCallback((s: Scan) => {
    setEditing(s); setFormCompany(s.companyName); setFormVehicle(s.vehicle)
    setFormPersonnel([...s.personnel]); setFormTests([...s.tests])
    setFormScanDate(s.scanDate); setFormNotes(s.notes); setFormStatus(s.status); setFormErrors({}); setShowModal(true)
    setAllPersonnel(getPersonnel()); setAllTests(getTests())
  }, [])

  const addPersonnel = useCallback(() => {
    if (!selectedPersonnel) return
    const p = allPersonnel.find((x) => x.name === selectedPersonnel)
    if (!p || formPersonnel.some((x) => x.name === p.name)) return
    setFormPersonnel((prev) => [...prev, { name: p.name, role: p.role }])
    setSelectedPersonnel('')
  }, [selectedPersonnel, allPersonnel, formPersonnel])

  const removePersonnel = useCallback((index: number) => {
    setFormPersonnel((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addTest = useCallback(() => {
    if (!selectedTest) return
    const t = allTests.find((x) => x.code === selectedTest)
    if (!t || formTests.some((x) => x.code === t.code)) return
    setFormTests((prev) => [...prev, { code: t.code, name: t.name, category: t.category }])
    setSelectedTest('')
  }, [selectedTest, allTests, formTests])

  const removeTest = useCallback((index: number) => {
    setFormTests((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!formCompany) errors.company = 'Firma seçin'
    if (formPersonnel.length === 0) errors.personnel = 'En az bir personel ekleyin'
    if (formTests.length === 0) errors.tests = 'En az bir test ekleyin'
    if (!formScanDate) errors.scanDate = 'Tarih seçin'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formCompany, formPersonnel, formTests, formScanDate])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    if (editing) {
      setScans((prev) => prev.map((s) => s.id === editing.id ? { ...s, companyName: formCompany, vehicle: formVehicle, personnel: formPersonnel, tests: formTests, scanDate: formScanDate, notes: formNotes, status: formStatus } : s))
      showToast('success', 'Tarama güncellendi')
    } else {
      const newId = Math.max(...scans.map((s) => s.id), 0) + 1
      setScans((prev) => [...prev, { id: newId, scanNo: nextScanNo(scans), companyName: formCompany, vehicle: formVehicle, personnel: formPersonnel, tests: formTests, scanDate: formScanDate, notes: formNotes, status: formStatus, createdAt: new Date().toISOString().slice(0, 10) }])
      showToast('success', 'Tarama oluşturuldu')
    }
    setShowModal(false)
  }, [editing, formCompany, formVehicle, formPersonnel, formTests, formScanDate, formNotes, formStatus, validateForm, setScans, scans, showToast])

  const handleDelete = useCallback(() => {
    if (!deleteId) return
    const name = scans.find((s) => s.id === deleteId)?.scanNo
    setScans((prev) => prev.filter((s) => s.id !== deleteId))
    setDeleteId(null)
    if (name) showToast('success', `"${name}" silindi`)
  }, [deleteId, scans, setScans, showToast])

  const toggleStatus = useCallback((id: number) => {
    setScans((prev) => prev.map((s) => {
      if (s.id !== id) return s
      const newStatus = s.status === 'active' ? 'passive' : 'active'
      showToast('success', `"${s.scanNo}" ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}`)
      return { ...s, status: newStatus }
    }))
  }, [setScans, showToast])

  const exportExcel = useCallback(() => {
    exportToExcel(scans as unknown as Record<string, unknown>[], [
      { header: 'Tarama No', key: 'scanNo' }, { header: 'Firma', key: 'companyName' },
      { header: 'Araç', key: 'vehicle' }, { header: 'Personel Sayısı', key: 'personnel', transform: (v) => String((v as unknown[]).length) },
      { header: 'Test Sayısı', key: 'tests', transform: (v) => String((v as unknown[]).length) },
      { header: 'Tarih', key: 'scanDate' }, { header: 'Durum', key: 'status', transform: (v) => v === 'active' ? 'Aktif' : 'Pasif' },
    ], 'taramalar')
    showToast('success', 'Excel dışa aktarıldı')
  }, [scans, showToast])

  const handlePageChange = useCallback((p: number) => setPage(p), [])
  const handlePerPageChange = useCallback((n: number) => { setPerPage(n); setPage(1) }, [])

  return (
    <div className="page-content">
      <ToastBar toast={toast} />

      <div className="content-top">
        <div><h2>Taramalar</h2><p className="content-subtitle">Firmalara ait sağlık tarama kayıtlarını yönetin</p></div>
        <div className="content-actions">
          <button className="btn btn-ghost" onClick={exportExcel} title="Excel dışa aktar" style={{ gap: 8, borderColor: 'var(--border)', padding: '8px 18px' }}>
            <FileSpreadsheet size={16} strokeWidth={1.6} style={{ color: '#22c55e' }} /> Excel Aktar
          </button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} strokeWidth={2} /> Tarama Oluştur</button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={15} strokeWidth={1.6} />
          <input ref={searchRef} type="text" placeholder="Tarama ara (no, firma)..."
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
                <th onClick={() => handleSort('scanNo')} className="sortable">Tarama No <SortArrow field="scanNo" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('companyName')} className="sortable" style={{ minWidth: 200 }}>Firma <SortArrow field="companyName" sortField={sortField} sortDir={sortDir} /></th>
                <th>Araç</th><th>Personel</th><th>Testler</th>
                <th onClick={() => handleSort('scanDate')} className="sortable">Tarih <SortArrow field="scanDate" sortField={sortField} sortDir={sortDir} /></th>
                <th onClick={() => handleSort('status')} className="sortable">Durum <SortArrow field="status" sortField={sortField} sortDir={sortDir} /></th>
                <th style={{ width: 110 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8}><div className="table-empty">
                  {search || filterStatus !== 'all'
                    ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen tarama bulunamadı</span></>
                    : <><Stethoscope size={24} strokeWidth={1.4} /><span>Henüz tarama oluşturulmamış</span></>}
                </div></td></tr>
              ) : (
                paged.map((s) => (
                  <tr key={s.id} className="clickable-row" onClick={() => setDetailScan(s)}>
                    <td><code className="test-code">{s.scanNo}</code></td>
                    <td><strong>{s.companyName}</strong></td>
                    <td><span className="cell-sub">{s.vehicle || '\u2014'}</span></td>
                    <td><span className="cell-number">{s.personnel.length}</span></td>
                    <td><span className="cell-number">{s.tests.length}</span></td>
                    <td><span className="cell-date"><Calendar size={12} strokeWidth={1.6} /> {s.scanDate}</span></td>
                    <td><button className={`status-badge ${s.status}`} onClick={(e) => { e.stopPropagation(); toggleStatus(s.id) }} title="Durumu değiştir">{s.status === 'active' ? 'Aktif' : 'Pasif'}</button></td>
                    <td><div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="cell-action-btn edit" onClick={() => openEdit(s)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                      <button className="cell-action-btn delete" onClick={() => setDeleteId(s.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
                ? <><Search size={24} strokeWidth={1.4} /><span>Filtrelerle eşleşen tarama bulunamadı</span></>
                : <><Stethoscope size={24} strokeWidth={1.4} /><span>Henüz tarama oluşturulmamış</span></>}
            </div>
          ) : (
            paged.map((s) => (
              <div key={s.id} className="company-card" style={{ borderTop: '3px solid #4f6cf7' }}>
                <div className="company-card-top">
                  <div className="company-card-avatar" style={{ background: '#eef2ff', color: '#4f6cf7' }}><Stethoscope size={18} strokeWidth={1.6} /></div>
                  <div><code className="test-code">{s.scanNo}</code></div>
                  <button className={`status-badge ${s.status}`} onClick={() => toggleStatus(s.id)} style={{ marginLeft: 'auto' }}>{s.status === 'active' ? 'Aktif' : 'Pasif'}</button>
                </div>
                <div className="company-card-body" onClick={() => setDetailScan(s)} style={{ cursor: 'pointer' }}>
                  <h4>{s.companyName}</h4>
                  <div className="company-card-meta">
                    <span><User size={12} strokeWidth={1.6} /> {s.personnel.length} personel</span>
                    <span><FlaskConical size={12} strokeWidth={1.6} /> {s.tests.length} test</span>
                    {s.vehicle && <span><Truck size={12} strokeWidth={1.6} /> {s.vehicle}</span>}
                    <span><Calendar size={12} strokeWidth={1.6} /> {s.scanDate}</span>
                  </div>
                </div>
                <div className="company-card-footer">
                  {s.notes && <span className="company-card-stats">{s.notes}</span>}
                  <div className="cell-actions" style={{ marginLeft: 'auto' }}>
                    <button className="cell-action-btn edit" onClick={() => openEdit(s)} title="Düzenle"><Edit3 size={15} strokeWidth={1.6} /></button>
                    <button className="cell-action-btn delete" onClick={() => setDeleteId(s.id)} title="Sil"><Trash2 size={15} strokeWidth={1.6} /></button>
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
              <h3><span className="header-icon"><Stethoscope size={14} strokeWidth={2} /></span>{editing ? 'Tarama Düzenle' : 'Yeni Tarama Oluştur'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} strokeWidth={2} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-section-card full" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">Firma & Araç</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group">
                      <label>Firma <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.company ? 'has-error' : ''}`}><Building2 size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formCompany} onChange={(e) => setFormCompany(e.target.value)}>
                          <option value="">Firma seçin</option>
                          {companies.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select></div>
                      {formErrors.company && <span className="field-error">{formErrors.company}</span>}
                    </div>
                    <div className="field-group">
                      <label>Mobil Araç</label>
                      <div className="input-wrap"><Truck size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={formVehicle} onChange={(e) => setFormVehicle(e.target.value)}>
                          <option value="">Araç seçin</option>
                          {allVehicles.filter((v) => v.status === 'active').map((v) => (
                            <option key={v.plate} value={v.name + ' (' + v.plate + ')'}>{v.name} ({v.plate})</option>
                          ))}
                        </select></div>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Tarama Tarihi <span className="required">*</span></label>
                      <div className={`input-wrap ${formErrors.scanDate ? 'has-error' : ''}`}><Calendar size={12} className="input-icon" strokeWidth={1.6} />
                        <input type="date" value={formScanDate} onChange={(e) => setFormScanDate(e.target.value)} /></div>
                      {formErrors.scanDate && <span className="field-error">{formErrors.scanDate}</span>}
                    </div>
                  </div>
                </div>

                <div className="form-section-card full" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">Personeller {formErrors.personnel && <span className="field-error" style={{ display: 'inline', marginLeft: 8 }}>{formErrors.personnel}</span>}</div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="input-wrap" style={{ flex: 1 }}><User size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={selectedPersonnel} onChange={(e) => setSelectedPersonnel(e.target.value)}>
                          <option value="">Personel seçin</option>
                          {allPersonnel.filter((p) => p.status === 'active').map((p) => (
                            <option key={p.name} value={p.name}>{p.name} ({p.role})</option>
                          ))}
                        </select></div>
                      <button className="btn btn-primary" onClick={addPersonnel} disabled={!selectedPersonnel} style={{ padding: '8px 16px', whiteSpace: 'nowrap', height: 38 }}>
                        <Plus size={14} strokeWidth={2} /> Ekle</button>
                    </div>
                    {formPersonnel.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {formPersonnel.map((p, i) => (
                          <span key={i} className="chip"><User size={12} strokeWidth={1.6} /> {p.name}
                            <span className="chip-sub">({p.role})</span>
                            <button className="chip-remove" onClick={() => removePersonnel(i)}><X size={12} strokeWidth={2} /></button></span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section-card full" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">Testler {formErrors.tests && <span className="field-error" style={{ display: 'inline', marginLeft: 8 }}>{formErrors.tests}</span>}</div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="input-wrap" style={{ flex: 1 }}><FlaskConical size={12} className="input-icon" strokeWidth={1.6} />
                        <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
                          <option value="">Test seçin</option>
                          {allTests.filter((t) => t.status === 'active').map((t) => (
                            <option key={t.code} value={t.code}>{t.code} — {t.name} ({t.category})</option>
                          ))}
                        </select></div>
                      <button className="btn btn-primary" onClick={addTest} disabled={!selectedTest} style={{ padding: '8px 16px', whiteSpace: 'nowrap', height: 38 }}>
                        <Plus size={14} strokeWidth={2} /> Ekle</button>
                    </div>
                    {formTests.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {formTests.map((t, i) => (
                          <span key={i} className="chip"><FlaskConical size={12} strokeWidth={1.6} /> {t.code}
                            <span className="chip-sub">({t.name})</span>
                            <button className="chip-remove" onClick={() => removeTest(i)}><X size={12} strokeWidth={2} /></button></span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section-card full" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">Notlar & Durum</div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notlar</label>
                      <div className="input-wrap textarea-wrap"><FileText size={12} className="input-icon" strokeWidth={1.6} />
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Tarama notları..." rows={2} /></div>
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
                {editing ? <><Check size={16} strokeWidth={2} /> Kaydet</> : <><Plus size={16} strokeWidth={2} /> Tarama Oluştur</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={deleteId !== null} title="Taramayı Sil"
        itemName={scans.find((s) => s.id === deleteId)?.scanNo || ''}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      {detailScan && (
        <div className="modal-overlay" onClick={() => setDetailScan(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-info">
                <div className="company-avatar-lg" style={{ background: '#eef2ff', color: '#4f6cf7' }}><Stethoscope size={20} strokeWidth={1.6} /></div>
                <div><h3>{detailScan.scanNo}</h3>
                  <span className={`status-badge ${detailScan.status}`} style={{ cursor: 'default' }}>{detailScan.status === 'active' ? 'Aktif' : 'Pasif'}</span></div>
              </div>
              <button className="modal-close" onClick={() => setDetailScan(null)}><X size={18} strokeWidth={1.6} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section"><h4><Building2 size={15} strokeWidth={1.8} /> Firma</h4>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Firma</span><strong>{detailScan.companyName}</strong></div>
                    <div className="detail-row"><span>Araç</span><strong>{detailScan.vehicle || '—'}</strong></div>
                    <div className="detail-row"><span>Tarih</span><strong>{detailScan.scanDate}</strong></div>
                  </div>
                </div>
                <div className="detail-section"><h4><User size={15} strokeWidth={1.8} /> Personeller</h4>
                  <div className="detail-rows">{detailScan.personnel.map((p, i) => (
                    <div key={i} className="detail-row"><span>{p.role}</span><strong>{p.name}</strong></div>
                  ))}</div>
                </div>
                <div className="detail-section full"><h4><FlaskConical size={15} strokeWidth={1.8} /> Testler</h4>
                  <div className="detail-rows">{detailScan.tests.map((t, i) => (
                    <div key={i} className="detail-row"><span>{t.category}</span><strong>{t.code} — {t.name}</strong></div>
                  ))}</div>
                </div>
                {detailScan.notes && (<div className="detail-section full"><h4><FileText size={15} strokeWidth={1.8} /> Notlar</h4><p className="detail-notes">{detailScan.notes}</p></div>)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setDetailScan(null); openEdit(detailScan) }}><Edit3 size={15} strokeWidth={1.6} /> Düzenle</button>
              <button className="btn btn-primary" onClick={() => setDetailScan(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
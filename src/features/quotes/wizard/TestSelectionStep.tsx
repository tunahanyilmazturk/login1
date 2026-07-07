import { useMemo } from 'react'
import {
  FlaskConical, Search, X, Plus, Trash2, TrendingDown, Receipt,
} from 'lucide-react'
import type { QuoteItem, TestItem, Company } from './types'
import { calcLineTotal, getCategoryColor } from './helpers'

interface Props {
  quoteTitle: string
  selectedCompany: Company | null
  items: QuoteItem[]
  allTests: TestItem[]
  testSearch: string
  testCategoryFilter: string
  itemsSubtotal: number
  itemsDiscountTotal: number
  subtotalAfterItems: number
  summaryDiscountMode: 'tl' | 'pct'
  summaryDiscountTL: number
  summaryDiscountPct: number
  summaryKdvPct: number
  summaryKdvAmount: number
  grandTotal: number
  onTestSearchChange: (v: string) => void
  onClearTestSearch: () => void
  onCategoryFilter: (s: string) => void
  onAddTest: (t: TestItem) => void
  onUpdateItem: (index: number, field: 'price' | 'quantity' | 'discount', value: number) => void
  onRemoveItem: (index: number) => void
  onSummaryDiscountMode: (m: 'tl' | 'pct') => void
  onSummaryDiscountTL: (v: number) => void
  onSummaryDiscountPct: (v: number) => void
  onSummaryKdvPct: (v: number) => void
}

export default function TestSelectionStep({
  quoteTitle, selectedCompany, items, allTests,
  testSearch, testCategoryFilter,
  itemsSubtotal, itemsDiscountTotal, subtotalAfterItems,
  summaryDiscountMode, summaryDiscountTL, summaryDiscountPct,
  summaryKdvPct, summaryKdvAmount, grandTotal,
  onTestSearchChange, onClearTestSearch, onCategoryFilter,
  onAddTest, onUpdateItem, onRemoveItem,
  onSummaryDiscountMode, onSummaryDiscountTL, onSummaryDiscountPct,
  onSummaryKdvPct,
}: Props) {
  const selectedCodes = useMemo(() => new Set(items.map((i) => i.testCode)), [items])

  const filteredTests = useMemo(() => {
    return allTests.filter((t) => {
      if (selectedCodes.has(t.code)) return false
      if (testCategoryFilter && t.category !== testCategoryFilter) return false
      if (!testSearch) return true
      const q = testSearch.toLowerCase()
      return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    })
  }, [allTests, testSearch, testCategoryFilter, selectedCodes])

  const uniqueTestCategories = useMemo(
    () => [...new Set(allTests.map((t) => t.category))].sort(),
    [allTests],
  )

  const effectiveSummaryDiscount = useMemo(() => {
    if (summaryDiscountMode === 'pct' && subtotalAfterItems > 0) {
      return subtotalAfterItems * (summaryDiscountPct / 100)
    }
    return summaryDiscountTL
  }, [summaryDiscountMode, summaryDiscountPct, summaryDiscountTL, subtotalAfterItems])

  return (
    <div className="wizard-panel wizard-tests-panel">
      <div className="wizard-panel-header">
        <h3><FlaskConical size={18} strokeWidth={1.8} /> Test Seçimi</h3>
        <p>
          <span>{quoteTitle}</span>
          {selectedCompany && (
            <span> — <strong>{selectedCompany.name}</strong> ({selectedCompany.employeeCount} çalışan)</span>
          )}
          — Seçilen: <strong>{items.length}</strong> test
        </p>
      </div>
      <div className="wizard-tests-split">
        <div className="wizard-tests-left">
          <div className="wizard-search-bar" style={{ marginBottom: 6 }}>
            <Search size={15} strokeWidth={1.6} />
            <input type="text" placeholder="Test ara..."
              value={testSearch} onChange={(e) => onTestSearchChange(e.target.value)} />
            {testSearch && <button className="table-search-clear" onClick={onClearTestSearch}><X size={14} strokeWidth={1.6} /></button>}
          </div>
          <div className="wizard-category-chips">
            <button className={`wizard-category-chip ${testCategoryFilter === '' ? 'active' : ''}`}
              onClick={() => onCategoryFilter('')}>Tümü</button>
            {uniqueTestCategories.map((cat) => (
              <button key={cat} className={`wizard-category-chip ${testCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => onCategoryFilter(cat)}
                style={testCategoryFilter === cat ? { background: getCategoryColor(cat), borderColor: getCategoryColor(cat) } : {}}>
                {cat}
              </button>
            ))}
          </div>
          <div className="wizard-test-list">
            {filteredTests.length === 0 ? (
              <div className="table-empty"><FlaskConical size={24} strokeWidth={1.4} /><span>Test bulunamadı</span></div>
            ) : (
              filteredTests.map((t) => (
                <button
                  key={t.id}
                  className="wizard-test-card-row"
                  onClick={() => onAddTest(t)}
                >
                  <div className="wizard-test-card-row-left">
                    <span className="sector-badge" style={{ background: getCategoryColor(t.category) + '18', color: getCategoryColor(t.category), fontSize: '0.65rem' }}>
                      {t.category}
                    </span>
                    <strong>{t.name}</strong>
                  </div>
                  <div className="wizard-test-card-row-right">
                    <span className="wizard-test-price">{t.price} TL</span>
                    <span className="wizard-add-icon"><Plus size={14} strokeWidth={2.5} /></span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="wizard-tests-right">
          <div className="wizard-selected-header">
            <h4>Seçilen Testler ({items.length})</h4>
            {selectedCompany && (
              <span className="wizard-qty-hint">Adet: {selectedCompany.employeeCount} çalışan</span>
            )}
          </div>
          {items.length === 0 ? (
            <div className="table-empty" style={{ flex: 1 }}>
              <FlaskConical size={24} strokeWidth={1.4} />
              <span>Soldan test ekleyin</span>
            </div>
          ) : (
            <>
              <div className="table-container" style={{ margin: 0, flex: 1, overflow: 'auto' }}>
                <table className="data-table wizard-selected-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 130 }}>Test Adı</th>
                      <th style={{ width: 56 }}>Fiyat</th>
                      <th style={{ width: 48 }}>Adet</th>
                      <th style={{ width: 72 }}>İndirim</th>
                      <th style={{ width: 78 }}>Tutar</th>
                      <th style={{ width: 34 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.testName}</td>
                        <td>
                          <input type="number" className="inline-input" value={item.price}
                            onChange={(e) => onUpdateItem(i, 'price', Number(e.target.value))} min={0} style={{ width: 50 }} />
                        </td>
                        <td>
                          <input type="number" className="inline-input" value={item.quantity}
                            onChange={(e) => onUpdateItem(i, 'quantity', Number(e.target.value))} min={1} style={{ width: 42 }} />
                        </td>
                        <td>
                          <div className="inline-input-group">
                            <input type="number" className="inline-input" value={item.discount}
                              onChange={(e) => onUpdateItem(i, 'discount', Number(e.target.value))} min={0} style={{ width: 50 }} />
                          </div>
                        </td>
                        <td><span className="cell-number">{calcLineTotal(item).toLocaleString()} TL</span></td>
                        <td>
                          <button className="cell-action-btn delete" onClick={() => onRemoveItem(i)} title="Kaldır">
                            <Trash2 size={13} strokeWidth={1.6} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="wizard-summary-box">
                <div className="wizard-summary-box-row">
                  <span>Ara Toplam</span>
                  <span>{itemsSubtotal.toLocaleString()} TL</span>
                </div>
                {itemsDiscountTotal > 0 && (
                  <div className="wizard-summary-box-row wizard-summary-box-discount">
                    <span>Test İndirimi</span>
                    <span>-{itemsDiscountTotal.toLocaleString()} TL</span>
                  </div>
                )}
                <div className="wizard-summary-box-row wizard-summary-box-sub">
                  <span>İndirim Sonrası</span>
                  <span>{subtotalAfterItems.toLocaleString()} TL</span>
                </div>

                <div className="wizard-summary-box-divider" />

                <div className="wizard-summary-box-row">
                  <span className="wizard-summary-box-label">
                    <TrendingDown size={12} strokeWidth={1.6} /> Genel İndirim
                  </span>
                  <div className="wizard-summary-box-inputs">
                    <div className="wizard-summary-box-mode">
                      <button
                        className={`wizard-toggle-btn ${summaryDiscountMode === 'tl' ? 'active' : ''}`}
                        onClick={() => { if (summaryDiscountMode !== 'tl') onSummaryDiscountMode('tl') }}
                      >TL</button>
                      <button
                        className={`wizard-toggle-btn ${summaryDiscountMode === 'pct' ? 'active' : ''}`}
                        onClick={() => { if (summaryDiscountMode !== 'pct') onSummaryDiscountMode('pct') }}
                      >%</button>
                    </div>
                    {summaryDiscountMode === 'tl' ? (
                      <div className="wizard-summary-box-input-group">
                        <input type="number" className="inline-input" value={summaryDiscountTL}
                          onChange={(e) => onSummaryDiscountTL(Number(e.target.value))} min={0} style={{ width: 64 }} />
                        <span className="wizard-summary-box-unit">TL</span>
                      </div>
                    ) : (
                      <div className="wizard-summary-box-input-group">
                        <input type="number" className="inline-input" value={summaryDiscountPct}
                          onChange={(e) => onSummaryDiscountPct(Number(e.target.value))} min={0} max={100} style={{ width: 56 }} />
                        <span className="wizard-summary-box-unit">%</span>
                      </div>
                    )}
                  </div>
                </div>

                {effectiveSummaryDiscount > 0 && (
                  <div className="wizard-summary-box-row wizard-summary-box-discount">
                    <span />
                    <span>-{effectiveSummaryDiscount.toLocaleString()} TL</span>
                  </div>
                )}

                <div className="wizard-summary-box-divider" />

                <div className="wizard-summary-box-row">
                  <span className="wizard-summary-box-label">
                    <Receipt size={12} strokeWidth={1.6} /> KDV
                  </span>
                  <div className="wizard-summary-box-inputs">
                    <div className="wizard-summary-box-input-group">
                      <input type="number" className="inline-input" value={summaryKdvPct}
                        onChange={(e) => onSummaryKdvPct(Math.max(0, Number(e.target.value)))} min={0} max={100} style={{ width: 56 }} />
                      <span className="wizard-summary-box-unit">%</span>
                    </div>
                  </div>
                </div>
                {summaryKdvAmount > 0 && (
                  <div className="wizard-summary-box-row wizard-summary-box-kdv">
                    <span />
                    <span>+{summaryKdvAmount.toLocaleString()} TL</span>
                  </div>
                )}

                <div className="wizard-summary-box-divider" />

                <div className="wizard-summary-box-row wizard-summary-box-grand">
                  <span>Genel Toplam</span>
                  <span>{grandTotal.toLocaleString()} TL</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Save, Check } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useToast } from '../../hooks/useToast'
import { ToastBar } from '../../components/ToastBar'
import type { Quote, QuoteType, QuoteItem, Company, TestItem } from './wizard/types'
import { STEPS } from './wizard/types'
import {
  getCompanies, getTests, nextQuoteNo, defaultValidUntil,
  generateTitle, calcLineTotal, STORAGE_KEY, DRAFT_KEY,
} from './wizard/helpers'
import CompanyStep from './wizard/CompanyStep'
import TestSelectionStep from './wizard/TestSelectionStep'
import CoverLetterStep from './wizard/CoverLetterStep'
import TermsStep from './wizard/TermsStep'
import SummaryStep from './wizard/SummaryStep'

export default function QuoteWizard() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useLocalStorage<Quote[]>(STORAGE_KEY, [])
  const { toast, showToast } = useToast(3000)

  const [step, setStep] = useState(0)
  const [quoteType, setQuoteType] = useState<QuoteType | null>(null)
  const [validUntil, setValidUntil] = useState(defaultValidUntil())
  const [quoteTitle, setQuoteTitle] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companySearch, setCompanySearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([])
  const [notes, setNotes] = useState('')
  const [testSearch, setTestSearch] = useState('')
  const [testCategoryFilter, setTestCategoryFilter] = useState('')
  const [companySort, setCompanySort] = useState<'name' | 'count' | 'sector'>('name')
  const [summaryDiscountMode, setSummaryDiscountMode] = useState<'tl' | 'pct'>('tl')
  const [summaryDiscountTL, setSummaryDiscountTL] = useState(0)
  const [summaryDiscountPct, setSummaryDiscountPct] = useState(0)
  const [summaryKdvPct, setSummaryKdvPct] = useState(0)
  const [coverLetter, setCoverLetter] = useState('')
  const [coverTemplateId, setCoverTemplateId] = useState('standard')
  const [terms, setTerms] = useState('')
  const [termsTemplateId, setTermsTemplateId] = useState('standard')

  const companies = useMemo(() => getCompanies().filter((c) => c.status === 'active'), [])
  const allTests = useMemo(() => getTests().filter((t) => t.status === 'active'), [])

  const recentCompanyNames = useMemo(() => {
    try {
      const raw = localStorage.getItem('hantech_quotes')
      if (!raw) return new Set<string>()
      const qs: Quote[] = JSON.parse(raw)
      return new Set(qs.map((q) => q.companyName))
    } catch { return new Set<string>() }
  }, [])

  const itemsSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )
  const itemsDiscountTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.discount, 0),
    [items],
  )
  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + calcLineTotal(item), 0),
    [items],
  )
  const subtotalAfterItems = itemsTotal

  const summaryDiscountFromPct = useMemo(
    () => subtotalAfterItems > 0 ? subtotalAfterItems * (summaryDiscountPct / 100) : 0,
    [subtotalAfterItems, summaryDiscountPct],
  )
  const summaryDiscountFromTL = summaryDiscountTL
  const effectiveSummaryDiscount = summaryDiscountMode === 'pct' ? summaryDiscountFromPct : summaryDiscountFromTL

  const summaryKdvAmount = useMemo(
    () => subtotalAfterItems > 0 ? subtotalAfterItems * (summaryKdvPct / 100) : 0,
    [subtotalAfterItems, summaryKdvPct],
  )

  const grandTotal = useMemo(
    () => Math.max(0, subtotalAfterItems - effectiveSummaryDiscount + summaryKdvAmount),
    [subtotalAfterItems, effectiveSummaryDiscount, summaryKdvAmount],
  )

  const canNext = useMemo(() => {
    if (step === 0) return quoteType !== null && selectedCompany !== null && validUntil !== '' && quoteTitle !== ''
    if (step === 1) return items.length > 0
    return true
  }, [step, quoteType, selectedCompany, validUntil, quoteTitle, items])

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }, [step])

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canNext) {
      if (step < STEPS.length - 1) handleNext()
    }
  }, [canNext, step, handleNext])

  const selectType = useCallback((t: QuoteType) => {
    setQuoteType(t)
    if (selectedCompany) {
      setQuoteTitle(generateTitle(t, selectedCompany.name, validUntil))
    }
  }, [selectedCompany, validUntil])

  const selectCompany = useCallback((c: Company) => {
    setSelectedCompany(c)
    if (quoteType) {
      setQuoteTitle(generateTitle(quoteType, c.name, validUntil))
    }
  }, [quoteType, validUntil])

  const handleValidUntilChange = useCallback((v: string) => {
    setValidUntil(v)
    if (quoteType && selectedCompany) {
      setQuoteTitle(generateTitle(quoteType, selectedCompany.name, v))
    }
  }, [quoteType, selectedCompany])

  const addTest = useCallback((test: TestItem) => {
    if (items.some((item) => item.testCode === test.code)) return
    setItems((prev) => [...prev, {
      testCode: test.code, testName: test.name, category: test.category,
      price: test.price, quantity: selectedCompany?.employeeCount || 1, discount: 0,
    }])
  }, [items, selectedCompany])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateItem = useCallback((index: number, field: 'price' | 'quantity' | 'discount', value: number) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      if (field === 'discount') return { ...item, discount: Math.max(0, value) }
      if (field === 'quantity') return { ...item, quantity: Math.max(1, value) }
      return { ...item, price: Math.max(0, value) }
    }))
  }, [])

  const updateTitle = useCallback((v: string) => setQuoteTitle(v), [])

  const handleSummaryDiscountMode = useCallback((mode: 'tl' | 'pct') => {
    setSummaryDiscountMode(mode)
  }, [])

  const handleSummaryDiscountTL = useCallback((v: number) => {
    setSummaryDiscountTL(Math.max(0, v))
    if (subtotalAfterItems > 0) {
      setSummaryDiscountPct(Math.round((v / subtotalAfterItems) * 10000) / 100)
    }
  }, [subtotalAfterItems])

  const handleSummaryDiscountPct = useCallback((v: number) => {
    setSummaryDiscountPct(Math.max(0, Math.min(100, v)))
    if (subtotalAfterItems > 0) {
      setSummaryDiscountTL(Math.round(subtotalAfterItems * (v / 100) * 100) / 100)
    }
  }, [subtotalAfterItems])

  const handleSave = useCallback(() => {
    const existing = quotes.length > 0 ? quotes : []
    const newId = Math.max(...existing.map((q) => q.id), 0) + 1
    const quote: Quote = {
      id: newId,
      quoteNo: nextQuoteNo(existing),
      companyName: selectedCompany!.name,
      quoteType: quoteType!, validUntil, quoteTitle,
      items, total: grandTotal, notes,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      discountTL: summaryDiscountMode === 'pct' ? 0 : summaryDiscountTL,
      discountPct: summaryDiscountMode === 'pct' ? summaryDiscountPct : 0,
      kdvPct: summaryKdvPct,
      coverLetter, terms,
    }
    setQuotes((prev) => [...prev, quote])
    localStorage.removeItem(DRAFT_KEY)
    showToast('success', `"${quote.quoteNo}" numaralı teklif oluşturuldu`)
    setTimeout(() => navigate(`/quotes/${newId}`), 500)
  }, [quotes, selectedCompany, quoteType, validUntil, quoteTitle, items, grandTotal, notes, effectiveSummaryDiscount, summaryDiscountPct, summaryKdvPct, coverLetter, terms, setQuotes, showToast, navigate])

  return (
    <div className="page-content wizard-page" onKeyDown={handleKeyDown}>
      <ToastBar toast={toast} />

      <div className="wizard-header">
        <button className="btn btn-ghost" onClick={() => navigate('/quotes')} style={{ padding: '6px 12px', gap: 6 }}>
          <ArrowLeft size={16} strokeWidth={1.6} /> Tekliflere Dön
        </button>
        <div className="wizard-title-group">
          <h2>Yeni Teklif Oluştur</h2>
          <p className="content-subtitle">Adım adım teklif oluşturma sihirbazı</p>
        </div>
      </div>

      <div className="wizard-layout">
        <aside className="wizard-sidebar">
          {STEPS.map((s, i) => {
            const isActive = step === i
            const isDone = step > i
            return (
              <button
                key={s.id}
                className={`wizard-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => { if (isDone) setStep(i) }}
                disabled={!isDone && !isActive}
              >
                <div className="wizard-step-indicator">
                  {isDone ? (
                    <span className="wizard-step-check"><Check size={14} strokeWidth={3} /></span>
                  ) : (
                    <span className="wizard-step-icon">{i + 1}</span>
                  )}
                </div>
                <div className="wizard-step-info">
                  <span className="wizard-step-num">Adım {i + 1}</span>
                  <span className="wizard-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight size={14} strokeWidth={1.6} className="wizard-step-arrow" />}
              </button>
            )
          })}
        </aside>

        <div className="wizard-content">
          {step === 0 && (
            <CompanyStep
              quoteType={quoteType}
              validUntil={validUntil}
              quoteTitle={quoteTitle}
              selectedCompany={selectedCompany}
              companySearch={companySearch}
              sectorFilter={sectorFilter}
              companySort={companySort}
              companies={companies}
              recentCompanyNames={recentCompanyNames}
              onSelectType={selectType}
              onValidUntilChange={handleValidUntilChange}
              onTitleChange={updateTitle}
              onSelectCompany={selectCompany}
              onSearchChange={setCompanySearch}
              onClearSearch={() => setCompanySearch('')}
              onSectorFilter={setSectorFilter}
              onSortChange={setCompanySort}
            />
          )}

          {step === 1 && (
            <TestSelectionStep
              quoteTitle={quoteTitle}
              selectedCompany={selectedCompany}
              items={items}
              allTests={allTests}
              testSearch={testSearch}
              testCategoryFilter={testCategoryFilter}
              itemsSubtotal={itemsSubtotal}
              itemsDiscountTotal={itemsDiscountTotal}
              subtotalAfterItems={subtotalAfterItems}
              summaryDiscountMode={summaryDiscountMode}
              summaryDiscountTL={summaryDiscountTL}
              summaryDiscountPct={summaryDiscountPct}
              summaryKdvPct={summaryKdvPct}
              summaryKdvAmount={summaryKdvAmount}
              grandTotal={grandTotal}
              onTestSearchChange={setTestSearch}
              onClearTestSearch={() => setTestSearch('')}
              onCategoryFilter={setTestCategoryFilter}
              onAddTest={addTest}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onSummaryDiscountMode={handleSummaryDiscountMode}
              onSummaryDiscountTL={handleSummaryDiscountTL}
              onSummaryDiscountPct={handleSummaryDiscountPct}
              onSummaryKdvPct={setSummaryKdvPct}
            />
          )}

          {step === 2 && (
            <CoverLetterStep
              quoteType={quoteType}
              quoteTitle={quoteTitle}
              selectedCompany={selectedCompany}
              coverLetter={coverLetter}
              coverTemplateId={coverTemplateId}
              onCoverLetterChange={setCoverLetter}
              onCoverTemplateChange={setCoverTemplateId}
            />
          )}

          {step === 3 && (
            <TermsStep
              selectedCompany={selectedCompany}
              terms={terms}
              termsTemplateId={termsTemplateId}
              onTermsChange={setTerms}
              onTermsTemplateChange={setTermsTemplateId}
            />
          )}

          {step === 4 && (
            <SummaryStep
              quoteTitle={quoteTitle}
              quoteType={quoteType}
              validUntil={validUntil}
              selectedCompany={selectedCompany}
              items={items}
              itemsSubtotal={itemsSubtotal}
              itemsDiscountTotal={itemsDiscountTotal}
              subtotalAfterItems={subtotalAfterItems}
              summaryDiscountMode={summaryDiscountMode}
              summaryDiscountTL={summaryDiscountTL}
              summaryDiscountPct={summaryDiscountPct}
              summaryKdvPct={summaryKdvPct}
              summaryKdvAmount={summaryKdvAmount}
              grandTotal={grandTotal}
              coverLetter={coverLetter}
              terms={terms}
              notes={notes}
              quotes={quotes}
              onNotesChange={setNotes}
            />
          )}

          <div className="wizard-actions">
            <div className="wizard-actions-left">
              {step > 0 && (
                <button className="btn btn-ghost" onClick={handleBack} style={{ gap: 6 }}>
                  <ArrowLeft size={16} strokeWidth={1.6} /> Geri
                </button>
              )}
            </div>
            <div className="wizard-actions-right">
              <span className="wizard-actions-hint">Enter ile ilerleyin</span>
              {step < STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={handleNext} disabled={!canNext} style={{ gap: 6 }}>
                  İleri <ChevronRight size={16} strokeWidth={2} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSave} disabled={!canNext} style={{ gap: 6 }}>
                  <Save size={16} strokeWidth={2} /> Teklifi Oluştur
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
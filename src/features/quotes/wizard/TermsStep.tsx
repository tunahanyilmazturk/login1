import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { FileText, Sparkles, RotateCcw, ScrollText, Plus, Check, X } from 'lucide-react'
import type { TermsTemplate, Company } from './types'

const STORAGE_KEY = 'hantech_terms_custom_templates'

interface Props {
  selectedCompany: Company | null
  terms: string
  termsTemplateId: string
  onTermsChange: (v: string) => void
  onTermsTemplateChange: (id: string) => void
}

const BUILT_IN: TermsTemplate[] = [
  {
    id: 'standard',
    label: 'Standart',
    text:
`1. TARAFLAR
İşbu teklif, hizmeti sunan firma ile hizmet alan firma arasında düzenlenmiştir.

2. HİZMET KAPSAMI
Teklif içeriğinde belirtilen sağlık muayene ve test hizmetleri, teklif tarihinden itibaren 30 gün içerisinde geçerli olmak üzere sunulacaktır. Hizmetler, ilgili mevzuat ve sağlık bakanlığı düzenlemelerine uygun şekilde gerçekleştirilecektir.

3. FİYATLANDIRMA VE ÖDEME
Teklifte belirtilen fiyatlar, teklif tarihinden itibaren 30 gün süreyle geçerlidir. Ödeme, hizmetin tamamlanmasını takiben düzenlenecek fatura karşılığında 30 gün içerisinde gerçekleştirilir.

4. İPTAL VE İADE
Hizmet başlamadan önce yapılacak iptallerde herhangi bir ücret talep edilmez. Hizmet başladıktan sonra yapılacak iptallerde gerçekleştirilen hizmet bedeli tahakkuk ettirilir.

5. GİZLİLİK
Tüm hasta ve çalışan verileri, Kişisel Sağlık Verilerinin İşlenmesi ve Mahremiyetinin Sağlanması kapsamında gizli tutulacak ve üçüncü kişilerle paylaşılmayacaktır.

6. YÜRÜRLÜK
İşbu teklif, her iki tarafın imzası ile yürürlüğe girer.`,
  },
  {
    id: 'compact',
    label: 'Kısa',
    text:
`1. Fiyatlar teklif tarihinden itibaren 30 gün geçerlidir.
2. Ödeme, fatura karşılığı 30 gün içinde yapılır.
3. Tüm sağlık verileri gizli tutulur, üçüncü kişilerle paylaşılmaz.
4. Hizmet öncesi iptallerde ücret alınmaz.
5. İşbu teklif, tarafların imzası ile yürürlüğe girer.`,
  },
  {
    id: 'detailed',
    label: 'Detaylı',
    text:
`1. TARAFLAR VE SÖZLEŞME KONUSU
İşbu teklif, bir tarafta hizmet sağlayıcı firma ile diğer tarafta hizmet alan firma arasında, teklif içeriğinde belirtilen sağlık muayene ve test hizmetlerinin sunulmasına ilişkin koşulları düzenlemek amacıyla düzenlenmiştir.

2. HİZMET KAPSAMI VE SUNUM ŞEKLİ
2.1. Hizmet sağlayıcı, teklifte belirtilen tüm test ve muayene hizmetlerini, ilgili mevzuat ve Sağlık Bakanlığı düzenlemelerine uygun şekilde sunmayı taahhüt eder.
2.2. Hizmetler, taraflarca mutabık kalınan takvim doğrultusunda, hizmet alan firmanın belirttiği lokasyonda veya hizmet sağlayıcının sağlık merkezinde gerçekleştirilir.

3. FİYATLANDIRMA VE ÖDEME KOŞULLARI
3.1. Teklifte belirtilen birim fiyatlar, teklif tarihinden itibaren 30 gün süreyle geçerlidir.
3.2. Fatura, hizmetin tamamlanmasını takiben düzenlenir ve 30 gün içerisinde ödenir.
3.3. Gecikme halinde yasal faiz uygulanır.

4. İPTAL, İADE VE DEĞİŞİKLİKLER
4.1. Hizmet başlangıcından en az 3 iş günü önce yapılan iptallerde herhangi bir ücret tahakkuk ettirilmez.
4.2. Hizmet başladıktan sonra yapılacak iptallerde, gerçekleştirilen hizmet bedeli fatura edilir.
4.3. Ek hizmet talepleri ayrıca fiyatlandırılır.

5. GİZLİLİK VE VERİ KORUMA
5.1. Hizmet sağlayıcı, tüm hasta ve çalışan verilerini KVKK ve ilgili sağlık verileri mevzuatı kapsamında gizli tutmayı taahhüt eder.
5.2. Sağlık verileri, yasal zorunluluklar dışında hiçbir şekilde üçüncü kişilerle paylaşılmaz.

6. YÜRÜRLÜK VE İMZA
İşbu teklif, taraflarca imzalandığı tarihte yürürlüğe girer ve teklifte belirtilen hizmetlerin tamamlanmasına kadar geçerliliğini korur.`,
  },
]

function loadCustom(): TermsTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveCustom(templates: TermsTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export default function TermsStep({
  selectedCompany, terms, termsTemplateId,
  onTermsChange, onTermsTemplateChange,
}: Props) {
  const [customTemplates, setCustomTemplates] = useState<TermsTemplate[]>(loadCustom)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const appliedRef = useRef(false)

  const allTemplates = useMemo(
    () => [...BUILT_IN, ...customTemplates],
    [customTemplates],
  )

  const activeTemplate = useMemo(
    () => allTemplates.find((t) => t.id === termsTemplateId) || null,
    [allTemplates, termsTemplateId],
  )

  useEffect(() => {
    if (!terms && !appliedRef.current) {
      appliedRef.current = true
      const tpl = BUILT_IN.find((t) => t.id === 'standard')
      if (tpl) {
        onTermsChange(tpl.text)
        onTermsTemplateChange('standard')
      }
    }
  }, [terms, onTermsChange, onTermsTemplateChange])

  useEffect(() => {
    if (showNewInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showNewInput])

  const applyTemplate = useCallback((id: string) => {
    const tpl = allTemplates.find((t) => t.id === id)
    if (tpl) {
      onTermsChange(tpl.text)
      onTermsTemplateChange(id)
    }
  }, [allTemplates, onTermsChange, onTermsTemplateChange])

  const handleCustom = useCallback(() => {
    onTermsTemplateChange('custom')
  }, [onTermsTemplateChange])

  const handleAddClick = useCallback(() => {
    setShowNewInput(true)
    setNewName('')
  }, [])

  const handleSaveNew = useCallback(() => {
    const name = newName.trim()
    if (!name || !terms) return
    const newTpl: TermsTemplate = {
      id: 'custom_' + Date.now(),
      label: name,
      text: terms,
    }
    const updated = [...customTemplates, newTpl]
    setCustomTemplates(updated)
    saveCustom(updated)
    onTermsTemplateChange(newTpl.id)
    setShowNewInput(false)
    setNewName('')
  }, [newName, terms, customTemplates, onTermsTemplateChange])

  const handleDeleteCustom = useCallback((id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id)
    setCustomTemplates(updated)
    saveCustom(updated)
    if (termsTemplateId === id) {
      onTermsTemplateChange('custom')
    }
  }, [customTemplates, termsTemplateId, onTermsTemplateChange])

  return (
    <div className="wizard-panel">
      <div className="wizard-panel-header">
        <h3><ScrollText size={18} strokeWidth={1.8} /> Şartlar & Koşullar</h3>
        <p>
          {selectedCompany
            ? `${selectedCompany.name} için şartlar ve koşullar`
            : 'Şartlar ve koşullar'}
        </p>
      </div>

      <div className="wizard-cover-body">
        <div className="wizard-cover-templates">
          <span className="wizard-cover-templates-label">Şablon Seçin</span>
          <div className="wizard-cover-templates-list">
            {BUILT_IN.map((tpl) => (
              <button
                key={tpl.id}
                className={`wizard-cover-template-btn ${termsTemplateId === tpl.id ? 'active' : ''}`}
                onClick={() => applyTemplate(tpl.id)}
              >
                <Sparkles size={13} strokeWidth={1.6} />
                {tpl.label}
              </button>
            ))}
            {customTemplates.length > 0 && (
              <div className="wizard-terms-custom-divider" />
            )}
            {customTemplates.map((tpl) => (
              <div key={tpl.id} className="wizard-terms-custom-wrap">
                <button
                  className={`wizard-cover-template-btn ${termsTemplateId === tpl.id ? 'active' : ''}`}
                  onClick={() => applyTemplate(tpl.id)}
                >
                  <FileText size={13} strokeWidth={1.6} />
                  {tpl.label}
                </button>
                <button
                  className="wizard-terms-custom-del"
                  onClick={() => handleDeleteCustom(tpl.id)}
                  title="Şablonu sil"
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button
              className={`wizard-cover-template-btn ${termsTemplateId === 'custom' ? 'active' : ''}`}
              onClick={handleCustom}
            >
              <FileText size={13} strokeWidth={1.6} />
              Özel
            </button>
            {!showNewInput && (
              <button
                className="wizard-cover-template-btn wizard-cover-template-add"
                onClick={handleAddClick}
                title="Geçerli metni şablon olarak kaydet"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            )}
            {termsTemplateId !== 'custom' && activeTemplate && !showNewInput && (
              <button
                className="wizard-cover-template-btn wizard-cover-template-apply"
                onClick={() => applyTemplate(termsTemplateId)}
                title="Şablonu tekrar uygula"
              >
                <RotateCcw size={12} strokeWidth={1.6} />
              </button>
            )}
          </div>

          {showNewInput && (
            <div className="wizard-terms-new">
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder="Şablon adı..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNew()
                  if (e.key === 'Escape') setShowNewInput(false)
                }}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn btn-primary" onClick={handleSaveNew} disabled={!newName.trim() || !terms}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                <Check size={14} strokeWidth={2.5} /> Kaydet
              </button>
              <button className="btn btn-ghost" onClick={() => setShowNewInput(false)}
                style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.6} />
              </button>
            </div>
          )}
        </div>

        <div className="wizard-cover-editor">
          <textarea
            className="wizard-cover-textarea wizard-terms-textarea"
            value={terms}
            onChange={(e) => {
              onTermsChange(e.target.value)
              if (termsTemplateId !== 'custom') {
                onTermsTemplateChange('custom')
              }
            }}
            placeholder="Şartlar ve koşulları yazın veya bir şablon seçin..."
          />
          <div className="wizard-cover-footer">
            <span className="wizard-cover-char-count">
              ~{Math.round(terms.length / 5)} kelime
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
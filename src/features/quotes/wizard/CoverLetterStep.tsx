import { useMemo, useCallback, useEffect, useRef } from 'react'
import { FileText, Sparkles, RotateCcw } from 'lucide-react'
import type { CoverTemplate, Company, QuoteType } from './types'

interface Props {
  quoteType: QuoteType | null
  quoteTitle: string
  selectedCompany: Company | null
  coverLetter: string
  coverTemplateId: string
  onCoverLetterChange: (v: string) => void
  onCoverTemplateChange: (id: string) => void
}

const ISE_TEMPLATES: CoverTemplate[] = [
  {
    id: 'standard',
    label: 'Standart',
    text: (c, _qt, title) =>
`Konu: ${title}

Sayın Yetkili,

${c} firması tarafından işe alınacak personelin işe giriş muayeneleri kapsamında gerçekleştirilmesi gereken sağlık tetkik ve değerlendirmelerine ilişkin teklifimizi sunmaktan memnuniyet duyarız.

Teklifimiz, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve Çalışanların İşe Giriş Muayeneleri Hakkında Yönetmelik kapsamında hazırlanmış olup, aşağıda belirtilen testleri içermektedir.

Fiyatlandırma, teklif tarihinden itibaren 30 gün süreyle geçerli olup, toplu katılımlarda özel indirim uygulanabilmektedir.

Detaylı bilgi ve randevu talepleriniz için profesyonel ekibimizle iletişime geçebilirsiniz.

Saygılarımızla,`,
  },
  {
    id: 'brief',
    label: 'Kısa',
    text: (c) =>
`Sayın Yetkili,

${c} firması personelinin işe giriş muayenelerine ilişkin teklifimizi ekte sunuyoruz.

Belirtilen koşullarda değerlendirmenizi rica ederiz.

Saygılarımızla,`,
  },
  {
    id: 'detailed',
    label: 'Detaylı',
    text: (c, _qt, title) =>
`Konu: ${title}

Sayın Yetkili,

6331 sayılı İş Sağlığı ve Güvenliği Kanunu ile Çalışanların İşe Giriş Muayeneleri Hakkında Yönetmelik hükümleri kapsamında ${c} firması tarafından işe alınacak personelin işe giriş muayenelerine ilişkin teklifimizi saygılarımızla arz ederiz.

Firmamız, Sağlık Bakanlığı'ndan yetkili uzman hekim kadrosu ve modern tanı ekipmanları ile çalışanlarınıza en üst düzeyde sağlık hizmeti sunmaktadır. İşe giriş muayeneleri, işe başlayacak tüm çalışanların yapacakları işe uygunluğunun değerlendirilmesi amacıyla gerçekleştirilmekte olup, kapsamlı sağlık raporu ile desteklenmektedir.

Teklifimize ilişkin detaylar aşağıda sunulmuştur:
• Uygulanacak test ve tetkikler
• Birim fiyat ve toplam teklif tutarı
• Geçerlilik süresi ve ödeme koşulları

Belirtilen fiyatlar, teklif tarihinden itibaren 30 gün süreyle geçerli olup, toplu katılımlarda %10'a varan özel indirim imkanı sunulmaktadır.

Değerlendirmeniz ve varsa talepleriniz için hafta içi mesai saatleri içerisinde bizlere ulaşabilirsiniz.

Saygılarımızla,`,
  },
]

const MOBIL_TEMPLATES: CoverTemplate[] = [
  {
    id: 'standard',
    label: 'Standart',
    text: (c, _qt, title) =>
`Konu: ${title}

Sayın Yetkili,

${c} firması çalışanlarının periyodik sağlık taramalarının mobil sağlık hizmetimiz ile firmanızda yerinde gerçekleştirilmesine yönelik teklifimizi sunmaktan memnuniyet duyarız.

Mobil sağlık tarama aracımız ile firmanıza gelerek numune alımı ve tetkik işlemleri gerçekleştirilmekte, çalışanlarınızın iş akışını aksatmadan sağlık taramaları tamamlanmaktadır.

Fiyatlandırma, teklif tarihinden itibaren 30 gün süreyle geçerli olup, toplu katılımlarda özel indirim uygulanabilmektedir.

Detaylı bilgi ve randevu talepleriniz için profesyonel ekibimizle iletişime geçebilirsiniz.

Saygılarımızla,`,
  },
  {
    id: 'brief',
    label: 'Kısa',
    text: (c) =>
`Sayın Yetkili,

${c} firması çalışanlarına yönelik mobil sağlık taraması hizmet teklifimizi ekte sunuyoruz.

Belirtilen koşullarda değerlendirmenizi rica ederiz.

Saygılarımızla,`,
  },
  {
    id: 'detailed',
    label: 'Detaylı',
    text: (c, _qt, title) =>
`Konu: ${title}

Sayın Yetkili,

6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler kapsamında ${c} firması çalışanlarının periyodik sağlık taramalarının mobil sağlık hizmeti ile firmanızda yerinde gerçekleştirilmesine ilişkin teklifimizi saygılarımızla arz ederiz.

Firmamız, Sağlık Bakanlığı'ndan yetkili uzman hekim kadrosu ve mobil sağlık tarama aracı ile donatılmış modern ekipmanları sayesinde firmanızda yerinde numune alımı, tetkik ve değerlendirme hizmeti sunmaktadır. Mobil ekibimiz, çalışanlarınızın iş akışını aksatmadan, belirlenen takvim doğrultusunda tüm taramaları titizlikle tamamlamaktadır.

Teklifimize ilişkin detaylar aşağıda sunulmuştur:
• Uygulanacak test ve tetkikler
• Mobil hizmet kapsamı ve planlaması
• Birim fiyat ve toplam teklif tutarı
• Geçerlilik süresi ve ödeme koşulları

Belirtilen fiyatlar, teklif tarihinden itibaren 30 gün süreyle geçerli olup, toplu katılımlarda %10'a varan özel indirim imkanı sunulmaktadır.

Değerlendirmeniz ve varsa talepleriniz için hafta içi mesai saatleri içerisinde bizlere ulaşabilirsiniz.

Saygılarımızla,`,
  },
]

const TEMPLATES_BY_TYPE: Record<QuoteType, CoverTemplate[]> = {
  ise_giris_muayene: ISE_TEMPLATES,
  mobil_saglik_taramasi: MOBIL_TEMPLATES,
}

export default function CoverLetterStep({
  quoteType, quoteTitle, selectedCompany, coverLetter, coverTemplateId,
  onCoverLetterChange, onCoverTemplateChange,
}: Props) {
  const companyName = selectedCompany?.name || '...'
  const appliedRef = useRef(false)

  const templates = useMemo(
    () => (quoteType ? TEMPLATES_BY_TYPE[quoteType] : ISE_TEMPLATES),
    [quoteType],
  )

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === coverTemplateId) || null,
    [templates, coverTemplateId],
  )

  useEffect(() => {
    if (selectedCompany && quoteType && !coverLetter && !appliedRef.current) {
      appliedRef.current = true
      const tpl = templates.find((t) => t.id === 'standard')
      if (tpl) {
        onCoverLetterChange(tpl.text(companyName, quoteType, quoteTitle))
        onCoverTemplateChange('standard')
      }
    }
  }, [selectedCompany, quoteType, quoteTitle, coverLetter, companyName, templates, onCoverLetterChange, onCoverTemplateChange])

  const applyTemplate = useCallback((id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (tpl && quoteType) {
      onCoverLetterChange(tpl.text(companyName, quoteType, quoteTitle))
      onCoverTemplateChange(id)
    }
  }, [templates, companyName, quoteType, quoteTitle, onCoverLetterChange, onCoverTemplateChange])

  const handleCustom = useCallback(() => {
    onCoverTemplateChange('custom')
  }, [onCoverTemplateChange])

  const typeLabel = quoteType === 'ise_giris_muayene' ? 'İşe Giriş Muayene' : 'Mobil Sağlık Taraması'

  return (
    <div className="wizard-panel">
      <div className="wizard-panel-header">
        <h3><FileText size={18} strokeWidth={1.8} /> Teklif Ön Yazısı</h3>
        <p>
          {selectedCompany
            ? `${selectedCompany.name} — ${typeLabel}`
            : 'Ön yazı oluşturmak için firma seçin'}
        </p>
      </div>

      <div className="wizard-cover-body">
        <div className="wizard-cover-templates">
          <span className="wizard-cover-templates-label">
            {typeLabel} — Şablon Seçin
          </span>
          <div className="wizard-cover-templates-list">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                className={`wizard-cover-template-btn ${coverTemplateId === tpl.id ? 'active' : ''}`}
                onClick={() => applyTemplate(tpl.id)}
              >
                <Sparkles size={13} strokeWidth={1.6} />
                {tpl.label}
              </button>
            ))}
            <button
              className={`wizard-cover-template-btn ${coverTemplateId === 'custom' ? 'active' : ''}`}
              onClick={handleCustom}
            >
              <FileText size={13} strokeWidth={1.6} />
              Özel
            </button>
            {coverTemplateId !== 'custom' && activeTemplate && (
              <button
                className="wizard-cover-template-btn wizard-cover-template-apply"
                onClick={() => applyTemplate(coverTemplateId)}
                title="Şablonu tekrar uygula"
              >
                <RotateCcw size={12} strokeWidth={1.6} />
              </button>
            )}
          </div>
        </div>

        <div className="wizard-cover-editor">
          <textarea
            className="wizard-cover-textarea"
            value={coverLetter}
            onChange={(e) => {
              onCoverLetterChange(e.target.value)
              if (coverTemplateId !== 'custom') {
                onCoverTemplateChange('custom')
              }
            }}
            placeholder={
              selectedCompany
                ? 'Ön yazınızı yazın veya bir şablon seçin...'
                : 'Lütfen önce firma seçimi yapın.'
            }
            disabled={!selectedCompany}
          />
          <div className="wizard-cover-footer">
            <span className="wizard-cover-char-count">
              ~{Math.round(coverLetter.length / 5)} kelime
            </span>
            {!selectedCompany && (
              <span className="wizard-cover-hint">Firma seçimi yapılmadı</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
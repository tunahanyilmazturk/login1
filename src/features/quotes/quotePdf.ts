import type { Quote } from './wizard/types'
import { calcLineTotal } from './wizard/helpers'

const COLOR_PRIMARY = '#0f172a'
const COLOR_ACCENT = '#2563eb'
const COLOR_MUTED = '#64748b'
const COLOR_BORDER = '#e2e8f0'
const COLOR_GREEN = '#10b981'
const COLOR_BLUE = '#3b82f6'

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

async function loadPdfMake() {
  const [pdfMakeModule, fontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  const pdfMake = (pdfMakeModule.default || pdfMakeModule) as any
  const vfs = (fontsModule.default || fontsModule) as any
  pdfMake.addVirtualFileSystem(vfs.vfs)
  return pdfMake as any
}

export async function downloadQuotePdf(quote: Quote) {
  try {
    const pdfMake = await loadPdfMake()
    const doc = buildDoc(quote)
    pdfMake.createPdf(doc).download(`${quote.quoteNo}_${quote.companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`)
  } catch (e) {
    console.error('PDF download error:', e)
    throw e
  }
}

export async function openQuotePdf(quote: Quote) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write('<html><body style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#666;margin:0;height:100%"><p>PDF hazırlanıyor...</p></body></html>')

  try {
    const pdfMake = await loadPdfMake()
    const doc = buildDoc(quote)
    const dataUrl = await pdfMake.createPdf(doc).getDataUrl()
    win.location.href = dataUrl
  } catch (e) {
    console.error('PDF open error:', e)
    win.document.write(`<html><body style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#ef4444;margin:0;height:100%"><p>PDF oluşturulurken hata oluştu.</p><p style="font-size:12px;color:#999">${e instanceof Error ? e.message : 'Bilinmeyen hata'}</p></body></html>`)
  }
}

function buildDoc(quote: Quote) {
  const itemsSubtotal = quote.items.reduce((s, item) => s + item.price * item.quantity, 0)
  const itemsDiscountTotal = quote.items.reduce((s, item) => s + item.discount, 0)
  const itemsTotal = quote.items.reduce((s, item) => s + calcLineTotal(item), 0)

  const globalDiscountAmount = quote.discountPct && quote.discountPct > 0
    ? itemsTotal * (quote.discountPct / 100)
    : (quote.discountTL || 0)

  const kdvAmount = itemsTotal * ((quote.kdvPct || 0) / 100)
  const quoteTypeLabel = quote.quoteType === 'ise_giris_muayene' ? 'İşe Giriş Muayene' : 'Mobil Sağlık Taraması'

  const now = new Date()
  const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  const content: any[] = []

  /* ── Brand Bar ── */
  content.push({
    table: {
      widths: ['*'],
      body: [[
        { text: 'TEKLİF FORMU', margin: [20, 12, 20, 12], color: '#fff', fontSize: 20, bold: true, alignment: 'center', fillColor: COLOR_PRIMARY },
      ]],
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 0, 0, 18],
  })

  /* ── Başlık ── */
  content.push({ text: quote.quoteTitle, fontSize: 13, bold: true, color: COLOR_PRIMARY, margin: [0, 0, 0, 14] })

  /* ── Bilgi Kutuları ── */
  content.push({
    columns: [
      {
        width: '50%',
        stack: [
          { text: 'TEKLİF BİLGİLERİ', fontSize: 9, bold: true, color: COLOR_MUTED, margin: [0, 0, 0, 6] },
          { text: [{ text: 'Teklif No: ', fontSize: 9, color: COLOR_MUTED }, { text: quote.quoteNo, fontSize: 9, bold: true }], margin: [0, 0, 0, 3] },
          { text: [{ text: 'Tür: ', fontSize: 9, color: COLOR_MUTED }, { text: quoteTypeLabel, fontSize: 9 }], margin: [0, 0, 0, 3] },
          { text: [{ text: 'Geçerlilik: ', fontSize: 9, color: COLOR_MUTED }, { text: quote.validUntil ? formatDate(quote.validUntil) : '\u2014', fontSize: 9 }], margin: [0, 0, 0, 3] },
          { text: [{ text: 'Oluşturulma: ', fontSize: 9, color: COLOR_MUTED }, { text: formatDate(quote.createdAt), fontSize: 9 }] },
        ],
      },
      {
        width: '50%',
        stack: [
          { text: 'FİRMA BİLGİLERİ', fontSize: 9, bold: true, color: COLOR_MUTED, margin: [0, 0, 0, 6] },
          { text: [{ text: 'Firma: ', fontSize: 9, color: COLOR_MUTED }, { text: quote.companyName, fontSize: 9, bold: true }], margin: [0, 0, 0, 3] },
        ],
      },
    ],
    margin: [0, 0, 0, 18],
  })

  /* ── Ayraç ── */
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR_BORDER }], margin: [0, 0, 0, 12] })

  /* ── Testler Tablosu ── */
  content.push({ text: 'TEST LİSTESİ', fontSize: 10, bold: true, color: COLOR_ACCENT, margin: [0, 0, 0, 8] })

  const tableBody: any[][] = [
    [
      { text: 'Test Adı', style: 'tableHeader' },
      { text: 'Birim Fiyat', style: 'tableHeader', alignment: 'right' },
      { text: 'Adet', style: 'tableHeader', alignment: 'center' },
      { text: 'İndirim', style: 'tableHeader', alignment: 'right' },
      { text: 'Tutar', style: 'tableHeader', alignment: 'right' },
    ],
  ]

  quote.items.forEach((item) => {
    tableBody.push([
      { text: item.testName, fontSize: 9, margin: [4, 4, 4, 4] },
      { text: item.price.toLocaleString() + ' TL', fontSize: 9, alignment: 'right', margin: [4, 4, 4, 4] },
      { text: String(item.quantity), fontSize: 9, alignment: 'center', margin: [4, 4, 4, 4] },
      { text: item.discount > 0 ? item.discount.toLocaleString() + ' TL' : '\u2014', fontSize: 9, alignment: 'right', margin: [4, 4, 4, 4], color: item.discount > 0 ? COLOR_GREEN : undefined },
      { text: calcLineTotal(item).toLocaleString() + ' TL', fontSize: 9, alignment: 'right', margin: [4, 4, 4, 4], bold: true },
    ])
  })

  content.push({
    table: { headerRows: 1, widths: ['*', 55, 40, 50, 65], body: tableBody },
    layout: {
      hLineWidth: (i: number) => (i === 0 || i === 1 ? 1.5 : 0.3),
      vLineWidth: () => 0,
      hLineColor: () => COLOR_BORDER,
    },
    margin: [0, 0, 0, 16],
  })

  /* ── Fiyat Özeti ── */
  const priceBody: any[][] = [
    [{ text: 'FİYAT ÖZETİ', style: 'sectionTitle', colSpan: 2 }, {}],
    [{ text: 'Ara Toplam', fontSize: 9, margin: [6, 4, 6, 4] }, { text: itemsSubtotal.toLocaleString() + ' TL', fontSize: 9, alignment: 'right', margin: [6, 4, 6, 4] }],
  ]

  if (itemsDiscountTotal > 0) {
    priceBody.push([
      { text: 'Test İndirimi', fontSize: 9, margin: [6, 4, 6, 4], color: COLOR_GREEN },
      { text: '-' + itemsDiscountTotal.toLocaleString() + ' TL', fontSize: 9, alignment: 'right', margin: [6, 4, 6, 4], color: COLOR_GREEN },
    ])
  }

  priceBody.push([
    { text: 'İndirim Sonrası', fontSize: 9, bold: true, margin: [6, 4, 6, 4] },
    { text: itemsTotal.toLocaleString() + ' TL', fontSize: 9, bold: true, alignment: 'right', margin: [6, 4, 6, 4] },
  ])

  /* Divider row */
  priceBody.push([{ text: '', colSpan: 2, border: [false, true, false, true] }, {}])

  if (globalDiscountAmount > 0) {
    const label = quote.discountPct && quote.discountPct > 0
      ? 'Genel İndirim (%' + quote.discountPct + ')'
      : 'Genel İndirim (' + (quote.discountTL || 0).toLocaleString() + ' TL)'
    priceBody.push([
      { text: label, fontSize: 9, margin: [6, 4, 6, 4], color: COLOR_GREEN },
      { text: '-' + globalDiscountAmount.toLocaleString() + ' TL', fontSize: 9, alignment: 'right', margin: [6, 4, 6, 4], color: COLOR_GREEN },
    ])
  }

  if (kdvAmount > 0) {
    priceBody.push([
      { text: 'KDV (%' + (quote.kdvPct || 0) + ')', fontSize: 9, margin: [6, 4, 6, 4], color: COLOR_BLUE },
      { text: '+' + kdvAmount.toLocaleString() + ' TL', fontSize: 9, alignment: 'right', margin: [6, 4, 6, 4], color: COLOR_BLUE },
    ])
  }

  /* Divider row */
  priceBody.push([{ text: '', colSpan: 2, border: [false, true, false, true] }, {}])

  priceBody.push([
    { text: 'GENEL TOPLAM', fontSize: 11, bold: true, margin: [6, 6, 6, 6], color: COLOR_PRIMARY },
    { text: quote.total.toLocaleString() + ' TL', fontSize: 11, bold: true, alignment: 'right', margin: [6, 6, 6, 6], color: COLOR_ACCENT },
  ])

  content.push({
    table: { widths: ['*', 100], body: priceBody },
    layout: {
      hLineWidth: (i: number, node: any) => {
        if (i === 0 || i === node.table.body.length - 1) return 1.5
        return 0.3
      },
      vLineWidth: () => 0,
      hLineColor: () => COLOR_BORDER,
    },
    margin: [0, 0, 0, 18],
  })

  /* ── Ön Yazı ── */
  if (quote.coverLetter) {
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR_BORDER }], margin: [0, 0, 0, 10] })
    content.push({ text: 'ÖN YAZI', style: 'sectionTitle', margin: [0, 0, 0, 6] })
    content.push({ text: quote.coverLetter, fontSize: 9, color: '#334155', lineHeight: 1.5, margin: [0, 0, 0, 14] })
  }

  /* ── Şartlar & Koşullar ── */
  if (quote.terms) {
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR_BORDER }], margin: [0, 0, 0, 10] })
    content.push({ text: 'ŞARTLAR & KOŞULLAR', style: 'sectionTitle', margin: [0, 0, 0, 6] })
    content.push({ text: quote.terms, fontSize: 9, color: '#334155', lineHeight: 1.5, margin: [0, 0, 0, 14] })
  }

  /* ── Notlar ── */
  if (quote.notes) {
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR_BORDER }], margin: [0, 0, 0, 10] })
    content.push({ text: 'NOTLAR', style: 'sectionTitle', margin: [0, 0, 0, 6] })
    content.push({ text: quote.notes, fontSize: 9, color: '#334155', lineHeight: 1.5 })
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    info: {
      title: quote.quoteNo + ' - ' + quote.quoteTitle,
      author: 'HanTech OSGB',
      subject: quoteTypeLabel + ' Teklifi',
    },
    header: () => ({
      margin: [40, 15, 40, 0],
      columns: [
        { text: 'HanTech OSGB', bold: true, fontSize: 14, color: COLOR_PRIMARY },
        { text: quote.quoteNo, fontSize: 10, color: COLOR_MUTED, alignment: 'right' },
      ],
    }),
    footer: (page: number, count: number) => ({
      margin: [40, 0, 40, 10],
      columns: [
        { text: dateStr + ' | HanTech OSGB', fontSize: 8, color: COLOR_MUTED },
        { text: page + ' / ' + count, fontSize: 8, color: COLOR_MUTED, alignment: 'right' },
      ],
    }),
    content,
    styles: {
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: '#fff',
        fillColor: COLOR_PRIMARY,
        alignment: 'center',
        margin: [4, 5, 4, 5],
      },
      sectionTitle: {
        fontSize: 10,
        bold: true,
        color: COLOR_ACCENT,
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  }
}
import * as XLSX from 'xlsx'

export interface ExcelColumn {
  header: string
  key: string
  transform?: (val: unknown) => string | number
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn[],
  fileName: string,
) {
  const rows = data.map((item) => {
    const row: Record<string, string | number> = {}
    for (const col of columns) {
      const raw = item[col.key]
      row[col.header] = col.transform ? col.transform(raw) : String(raw ?? '')
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  const colWidths = columns.map((col) => ({
    wch: Math.max(col.header.length * 2, 14),
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1')

  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

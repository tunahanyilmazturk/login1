import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  total, page, perPage, onPageChange, onPerPageChange,
}: {
  total: number
  page: number
  perPage: number
  onPageChange: (p: number) => void
  onPerPageChange: (n: number) => void
}) {
  const totalPages = Math.ceil(total / perPage)
  if (total <= perPage && totalPages <= 1) return null

  return (
    <div className="pagination">
      <div className="pagination-left">
        <span className="pagination-info">Toplam {total} kayıt</span>
        <select className="per-page-select" value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))}>
          <option value={5}>5 / sayfa</option>
          <option value={8}>8 / sayfa</option>
          <option value={10}>10 / sayfa</option>
          <option value={15}>15 / sayfa</option>
          <option value={20}>20 / sayfa</option>
          <option value={50}>50 / sayfa</option>
        </select>
      </div>
      {totalPages > 1 && (
        <div className="pagination-btns">
          <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft size={15} strokeWidth={1.6} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>
              {p}
            </button>
          ))}
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight size={15} strokeWidth={1.6} />
          </button>
        </div>
      )}
    </div>
  )
}
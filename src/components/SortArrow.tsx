import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import type { SortDir } from '../hooks/useFilteredList'

export function SortArrow({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown size={12} strokeWidth={1.6} className="sort-arrow-idle" />
  return sortDir === 'asc'
    ? <ChevronUp size={13} strokeWidth={2} className="sort-arrow" />
    : <ChevronDown size={13} strokeWidth={2} className="sort-arrow" />
}
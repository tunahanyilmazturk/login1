import { useState, useCallback } from 'react'

export type SortDir = 'asc' | 'desc'

export interface FilterConfig<T> {
  items: T[]
  search: string
  searchFields: (keyof T)[]
  filters?: Record<string, (item: T) => boolean>
  sortField: keyof T
  sortDir: SortDir
  comparator?: (a: T, b: T, field: keyof T, dir: SortDir) => number
}

export function useFilteredList<T extends { id: number | string }>(config: {
  items: T[]
  perPage?: number
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(config.perPage ?? 10)

  const resetPage = useCallback(() => setPage(1), [])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handlePerPage = useCallback((value: number) => {
    setPerPage(value)
    setPage(1)
  }, [])

  return {
    search, setSearch: handleSearch,
    page, setPage,
    perPage, setPerPage: handlePerPage,
    resetPage,
    filteredItems: config.items,
  }
}
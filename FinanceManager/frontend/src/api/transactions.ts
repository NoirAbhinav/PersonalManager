const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface TransactionFilters {
  category_id?: string
  type?: string
  from?: string        // ISO string
  to?: string          // ISO string
  min_amount?: number
  max_amount?: number
  search?: string
}

export interface PaginatedTransactions {
  transactions: any[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function fetchTransactions(
  page = 1,
  pageSize = 20,
  filters: TransactionFilters = {}
): Promise<PaginatedTransactions> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('page_size', String(pageSize))

  if (filters.category_id) params.set('category_id', filters.category_id)
  if (filters.type)        params.set('type', filters.type)
  if (filters.from)        params.set('from', filters.from)
  if (filters.to)          params.set('to', filters.to)
  if (filters.min_amount != null) params.set('min_amount', String(filters.min_amount))
  if (filters.max_amount != null) params.set('max_amount', String(filters.max_amount))
  if (filters.search)      params.set('search', filters.search)

  const res = await fetch(`${API_BASE_URL}/finance/transactions?${params.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}
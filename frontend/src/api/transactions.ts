import { Transaction, TransactionsResponse } from '../types/transaction'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface PaginatedTransactions {
  transactions: any[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function fetchTransactions(page = 1, pageSize = 20): Promise<PaginatedTransactions> {
  const res = await fetch(
    `${API_BASE_URL}/transactions?page=${page}&page_size=${pageSize}`,
    {
      credentials: 'include',
    }
  )
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}


export async function getTransactionStats(transactions: Transaction[]) {
  const debited = transactions
    .filter((t) => t.type === 'debited')
    .reduce((sum, t) => sum + t.amount, 0)

  const credited = transactions
    .filter((t) => t.type === 'credited')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    totalDebited: debited,
    totalCredited: credited,
    netAmount: credited - debited,
    transactionCount: transactions.length,
  }
}

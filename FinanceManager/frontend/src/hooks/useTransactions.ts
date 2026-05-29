import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTransactions, TransactionFilters } from '../api/transactions'
import { Transaction } from '../types/transaction'

export function useTransactions(filters: TransactionFilters = {}) {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const setPageAndReset = (p: number) => setPage(p)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', page, filters],
    queryFn: () => fetchTransactions(page, pageSize, filters),
    staleTime: 60000,
    retry: 2,
  })

  const normalized: Transaction[] = (data?.transactions ?? []).map((t: any) => ({
    id: t.ID,
    amount: t.Amount,
    type: t.Type,
    account_last4: t.AccountLast4,
    merchant: t.Merchant,
    name: t.Name,
    reference_id: t.ReferenceID,
    occurred_at: t.OccurredAt,
    created_at: t.CreatedAt,
    category_name: t.CategoryName,
    category_color: t.CategoryColor,
  }))

  return {
    transactions: normalized,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    page,
    setPage: setPageAndReset,
    totalPages: data?.total_pages ?? 1,
    total: data?.total ?? 0,
  }
}

export function useTransactionStats(transactions: Transaction[]) {
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
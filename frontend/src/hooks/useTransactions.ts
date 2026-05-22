import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '../api/transactions'
import { Transaction } from '../types/transaction'

export function useTransactions() {
  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    staleTime: 60000, // 1 minute
    retry: 2,
  })

  const normalized: Transaction[] = transactions.map((t: any) => ({
    id: t.ID,
    amount: t.Amount,
    type: t.Type,
    account_last4: t.AccountLast4,
    merchant: t.Merchant,
    name: t.Name,
    reference_id: t.ReferenceID,
    occurred_at: t.OccurredAt,
    created_at: t.CreatedAt,
    updated_at: t.UpdatedAt,
    }))

  return {
    transactions: normalized,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
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

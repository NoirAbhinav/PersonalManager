import { Transaction, TransactionsResponse } from '../types/transaction'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }

    const data: TransactionsResponse = await response.json()
    console.log('Fetched transactions:', data.transactions)
    return data.transactions || []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
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

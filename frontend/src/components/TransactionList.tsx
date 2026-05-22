import { Transaction } from '../types/transaction'
import TransactionRow from './TransactionRow'
import { AlertCircle } from 'lucide-react'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
  error?: string | null
}

export default function TransactionList({ transactions, isLoading, error }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error Loading Transactions</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600">No transactions yet</p>
        <p className="text-sm text-gray-500 mt-1">Click "Sync Gmail" to import transactions</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
      </div>
      <div>
        {transactions.map((transaction) => (
          <TransactionRow key={transaction.reference_id || transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  )
}

import { Transaction } from '../types/transaction'
import { formatCurrency, formatDate } from '../utils/formatting'
import { ArrowDown, ArrowUp } from 'lucide-react'

interface TransactionRowProps {
  transaction: Transaction
}

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const isDebited = transaction.type === 'debited'

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDebited ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          {isDebited ? (
            <ArrowDown className="w-5 h-5 text-red-600" />
          ) : (
            <ArrowUp className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{transaction.merchant || transaction.name}</p>
          <p className="text-sm text-gray-600">
            {transaction.account_last4 && `••••${transaction.account_last4}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.occurred_at)}</p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`font-semibold text-lg ${isDebited ? 'text-red-600' : 'text-green-600'}`}
        >
          {isDebited ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        {transaction.reference_id && (
          <p className="text-xs text-gray-500 mt-1">Ref: {transaction.reference_id}</p>
        )}
      </div>
    </div>
  )
}

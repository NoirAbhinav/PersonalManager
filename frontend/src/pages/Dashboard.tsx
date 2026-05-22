import { useEffect } from 'react'
import Header from '../components/Header'
import TransactionList from '../components/TransactionList'
import SyncButton from '../components/SyncButton'
import { useTransactions, useTransactionStats } from '../hooks/useTransactions'
import { CreditCard, TrendingDown, TrendingUp, ActivitySquare } from 'lucide-react'
import { formatCurrency } from '../utils/formatting'

export default function Dashboard() {
  const { transactions, isLoading, error, refetch } = useTransactions()
  const stats = useTransactionStats(transactions)

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [refetch])

  const statCards = [
    {
      icon: TrendingDown,
      label: 'Total Debited',
      value: formatCurrency(stats.totalDebited),
      color: 'red',
    },
    {
      icon: TrendingUp,
      label: 'Total Credited',
      value: formatCurrency(stats.totalCredited),
      color: 'green',
    },
    {
      icon: CreditCard,
      label: 'Net Amount',
      value: formatCurrency(stats.netAmount),
      color: stats.netAmount >= 0 ? 'green' : 'red',
    },
    {
      icon: ActivitySquare,
      label: 'Transactions',
      value: stats.transactionCount.toString(),
      color: 'blue',
    },
  ]

  const colorClasses = {
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sync Section */}
        <div className="mb-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Synchronization</h2>
            <SyncButton onSyncComplete={() => refetch()} />
          </div>
        </div>

        {/* Transactions List */}
        <TransactionList transactions={transactions} isLoading={isLoading} error={error} />
      </main>
    </div>
  )
}

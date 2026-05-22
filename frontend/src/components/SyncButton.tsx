import { RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useSync } from '../hooks/useSync'

interface SyncButtonProps {
  onSyncComplete?: () => void
}

const statusConfig = {
  idle:      { label: 'Sync Gmail',  bar: null },
  syncing:   { label: 'Syncing...',  bar: { color: 'blue',  text: 'Syncing your Gmail transactions...' } },
  completed: { label: 'Sync Gmail',  bar: { color: 'green', text: 'Transactions synced successfully!' } },
  failed:    { label: 'Retry Sync',  bar: null },
}

export default function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const { sync, status, error } = useSync(onSyncComplete)
  const config = statusConfig[status]

  return (
    <div className="space-y-3">
      <button
        onClick={sync}
        disabled={status === 'syncing'}
        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'syncing'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <RefreshCw className="w-4 h-4" />
        }
        <span>{config.label}</span>
      </button>

      {/* Progress bar */}
      {status === 'syncing' && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-full" />
          </div>
          <p className="text-xs text-gray-500 text-center">{config.bar?.text}</p>
        </div>
      )}

      {/* Success */}
      {status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">{config.bar?.text}</p>
        </div>
      )}

      {/* Error */}
      {status === 'failed' && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
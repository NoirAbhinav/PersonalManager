import { RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useSync } from '../hooks/useSync'

interface SyncButtonProps {
  onSyncComplete?: () => void
}

export default function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const { sync, status, error, progress } = useSync(onSyncComplete)

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
        <span>
          {status === 'syncing' ? 'Syncing...' : status === 'failed' ? 'Retry Sync' : 'Sync Gmail'}
        </span>
      </button>

      {status === 'syncing' && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full animate-[slide_1.5s_ease-in-out_infinite]" 
                 style={{ width: '40%' }} />
          </div>
          <p className="text-xs text-gray-500 text-center">Fetching Gmail transactions...</p>
        </div>
      )}

      {status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            {progress.total > 0
              ? `Synced ${progress.total} emails successfully!`
              : 'Already up to date!'}
          </p>
        </div>
      )}

      {status === 'failed' && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
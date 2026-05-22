export interface Transaction {
  id: string
  amount: number
  type: 'debited' | 'credited'
  account_last4: string
  merchant: string
  name: string
  reference_id: string
  occurred_at: string
  created_at?: string
  updated_at?: string
}

export interface TransactionsResponse {
  transactions: Transaction[]
  error?: string
}

export interface SyncResponse {
  status: string
  error?: string
}

export interface HealthResponse {
  status: string
}

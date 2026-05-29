import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { TransactionFilters } from '../api/transactions'
import { Category } from '../api/categories'

interface FilterBarProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  categories: Category[]
}

export default function FilterBar({ filters, onChange, categories }: FilterBarProps) {
  const [open, setOpen] = useState(false)

  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length

  const set = (key: keyof TransactionFilters, value: any) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  const clear = () => onChange({})

  return (
    <div className="card p-0 overflow-hidden mb-4">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
              {activeCount}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="border-t border-gray-200 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search merchant / name</label>
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={(e) => set('search', e.target.value)}
              placeholder="e.g. Swiggy"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={filters.category_id ?? ''}
              onChange={(e) => set('category_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
                {categories.map((c) => (
                <option key={c.ID} value={c.ID}>{c.Name}</option>
                ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={filters.type ?? ''}
              onChange={(e) => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="debited">Debited</option>
              <option value="credited">Credited</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From date</label>
            <input
              type="date"
              value={filters.from ? filters.from.split('T')[0] : ''}
              onChange={(e) =>
                set('from', e.target.value ? e.target.value + 'T00:00:00Z' : '')
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To date</label>
            <input
              type="date"
              value={filters.to ? filters.to.split('T')[0] : ''}
              onChange={(e) =>
                set('to', e.target.value ? e.target.value + 'T23:59:59Z' : '')
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount range */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Min amount</label>
              <input
                type="number"
                value={filters.min_amount ?? ''}
                onChange={(e) => set('min_amount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Max amount</label>
              <input
                type="number"
                value={filters.max_amount ?? ''}
                onChange={(e) => set('max_amount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="∞"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear */}
          {activeCount > 0 && (
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                onClick={clear}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
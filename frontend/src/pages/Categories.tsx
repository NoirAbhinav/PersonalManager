import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/Header'
import {
  fetchCategories, createCategory, updateCategory,
  deleteCategory, fetchRules, addRule, deleteRule,
  recategorizeAll, Category, CategoryRule,
} from '../api/categories'
import { Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, X, Check } from 'lucide-react'

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6B7280', '#F97316',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PRESET_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: value === color ? '#1f2937' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

function CategoryCard({ category }: { category: Category }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.Name)
  const [color, setColor] = useState(category.Color)
  const [newKeyword, setNewKeyword] = useState('')

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['rules', category.ID],
    queryFn: () => fetchRules(category.ID),
    enabled: expanded,
  })

  const updateMutation = useMutation({
    mutationFn: () => updateCategory(category.ID, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(category.ID),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const addRuleMutation = useMutation({
    mutationFn: () => addRule(category.ID, newKeyword.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', category.ID] })
      setNewKeyword('')
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleID: string) => deleteRule(category.ID, ruleID),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules', category.ID] }),
  })

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: category.Color }} />
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="border border-gray-300 rounded px-2 py-0.5 text-sm"
              autoFocus
            />
          ) : (
            <span className="font-medium text-gray-900">{category.Name}</span>
          )}
          {category.IsSystem && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">system</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!category.IsSystem && (
            editing ? (
              <>
                <button onClick={() => updateMutation.mutate()} className="text-green-600 hover:text-green-700">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {editing && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          <ColorPicker value={color} onChange={setColor} />
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 mb-2">Keywords</p>
          {rulesLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {rules.map((rule: CategoryRule) => (
                <span
                  key={rule.ID}
                  className="flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-1"
                >
                  {rule.Keyword}
                  <button
                    onClick={() => deleteRuleMutation.mutate(rule.ID)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {rules.length === 0 && (
                <p className="text-sm text-gray-400">No keywords yet</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newKeyword.trim() && addRuleMutation.mutate()}
              placeholder="Add keyword..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <button
              onClick={() => newKeyword.trim() && addRuleMutation.mutate()}
              disabled={!newKeyword.trim()}
              className="btn-primary text-sm px-3 py-1 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Categories() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [recatResult, setRecatResult] = useState<number | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const createMutation = useMutation({
    mutationFn: () => createCategory(newName.trim(), newColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setShowForm(false)
    },
  })

  const recatMutation = useMutation({
    mutationFn: recategorizeAll,
    onSuccess: (data) => {
      setRecatResult(data.categorized)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const system = categories.filter((c: Category) => c.IsSystem)
  const user = categories.filter((c: Category) => !c.IsSystem)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Categories" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recategorize banner */}
        <div className="card mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Re-run categorization</p>
            <p className="text-sm text-gray-500">Apply all rules to uncategorized transactions</p>
          </div>
          <div className="flex items-center gap-3">
            {recatResult !== null && (
              <span className="text-sm text-green-600">{recatResult} categorized</span>
            )}
            <button
              onClick={() => recatMutation.mutate()}
              disabled={recatMutation.isPending}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${recatMutation.isPending ? 'animate-spin' : ''}`} />
              Run
            </button>
          </div>
        </div>

        {/* User categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your categories</h2>
            <button
              onClick={() => setShowForm(f => !f)}
              className="btn-primary flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {showForm && (
            <div className="card mb-4">
              <div className="space-y-3">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Category name"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  autoFocus
                />
                <ColorPicker value={newColor} onChange={setNewColor} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                  <button
                    onClick={() => newName.trim() && createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {user.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 text-center py-6">
              No custom categories yet — add one above
            </p>
          )}
          <div className="space-y-3">
            {user.map((c: Category) => <CategoryCard key={c.ID} category={c} />)}
          </div>
        </div>

        {/* System categories */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">System categories</h2>
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-3">
              {system.map((c: Category) => <CategoryCard key={c.ID} category={c} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
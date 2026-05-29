const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface Category {
  ID: string
  UserID: string | null
  Name: string
  Color: string
  IsSystem: boolean
  CreatedAt: string
}

export interface CategoryRule {
  ID: string
  CategoryID: string
  Keyword: string
  CreatedAt: string
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/finance/categories`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data = await res.json()
  return data.categories
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/finance/categories`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  })
  if (!res.ok) throw new Error('Failed to create category')
  return res.json()
}

export async function updateCategory(id: string, name: string, color: string): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/finance/categories/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  })
  if (!res.ok) throw new Error('Failed to update category')
  return res.json()
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/finance/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete category')
}

export async function fetchRules(categoryID: string): Promise<CategoryRule[]> {
  const res = await fetch(`${API_BASE_URL}/finance/categories/${categoryID}/rules`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch rules')
  const data = await res.json()
  return data.rules
}

export async function addRule(categoryID: string, keyword: string): Promise<CategoryRule> {
  const res = await fetch(`${API_BASE_URL}/finance/categories/${categoryID}/rules`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  })
  if (!res.ok) throw new Error('Failed to add rule')
  return res.json()
}

export async function deleteRule(categoryID: string, ruleID: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/finance/categories/${categoryID}/rules/${ruleID}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete rule')
}

export async function recategorizeAll(): Promise<{ categorized: number }> {
  const res = await fetch(`${API_BASE_URL}/finance/transactions/recategorize`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to recategorize')
  return res.json()
}
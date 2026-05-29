import { useQuery } from '@tanstack/react-query'
import { fetchCategories, Category } from '../api/categories'

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 300000, // 5 min — categories don't change often
  })

  return {
    categories: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
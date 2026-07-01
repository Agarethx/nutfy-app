import { useState } from 'react'
import { FlatList, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage'
import { Loader } from '@/shared/components/ui/Loader'
import { Button } from '@/shared/components/ui/Button'
import { useIngredients } from '../hooks/use-ingredients'
import { useCategories } from '../hooks/use-categories'
import { IngredientCard } from '../components/IngredientCard'
import { FilterChips } from '../components/FilterChips'
import type { Ingredient, IngredientCategory } from '../domain/ingredient.types'

export function IngredientsListScreen() {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const { data: ingredients, isLoading, error, refetch } = useIngredients({
    category_id: categoryId ?? undefined,
    status: 'ACTIVE',
  })
  const { data: categories } = useCategories()

  const categoryOptions = (categories ?? []).map((c: IngredientCategory) => ({ value: c.id, label: c.name }))

  const addButton = (
    <Pressable
      onPress={() => router.push('/knowledge-base/ingredients/new')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="add" size={24} color="#16a34a" />
    </Pressable>
  )

  return (
    <Screen>
      <Header title="Ingredientes" right={addButton} />
      <FilterChips
        options={categoryOptions}
        selected={categoryId}
        onSelect={setCategoryId}
      />
      {isLoading && <Loader />}
      {!isLoading && error && (
        <ErrorMessage message="No se pudieron cargar los ingredientes" onRetry={refetch} />
      )}
      {!isLoading && !error && (
        <FlatList
          data={ingredients ?? []}
          keyExtractor={(item: Ingredient) => item.id}
          renderItem={({ item }) => <IngredientCard ingredient={item} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="Sin ingredientes"
              description="Agrega el primer ingrediente de tu base de conocimiento"
              action={
                <Button
                  label="Agregar ingrediente"
                  onPress={() => router.push('/knowledge-base/ingredients/new')}
                />
              }
            />
          }
        />
      )}
    </Screen>
  )
}

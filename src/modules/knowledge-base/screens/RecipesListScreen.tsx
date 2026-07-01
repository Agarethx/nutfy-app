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
import { useRecipes } from '../hooks/use-recipes'
import { RecipeCard } from '../components/RecipeCard'
import { FilterChips } from '../components/FilterChips'
import type { DifficultyLevel } from '../domain/shared.types'
import type { Recipe } from '../domain/recipe.types'

const DIFFICULTY_OPTIONS = [
  { value: 'EASY' as DifficultyLevel, label: 'Fácil' },
  { value: 'MEDIUM' as DifficultyLevel, label: 'Media' },
  { value: 'HARD' as DifficultyLevel, label: 'Difícil' },
  { value: 'EXPERT' as DifficultyLevel, label: 'Experto' },
]

export function RecipesListScreen() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null)

  const { data: recipes, isLoading, error, refetch } = useRecipes({
    difficulty: difficulty ?? undefined,
  })

  const addButton = (
    <Pressable
      onPress={() => router.push('/knowledge-base/recipes/new')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="add" size={24} color="#16a34a" />
    </Pressable>
  )

  return (
    <Screen>
      <Header title="Recetas" right={addButton} />
      <FilterChips
        options={DIFFICULTY_OPTIONS}
        selected={difficulty}
        onSelect={setDifficulty}
        allLabel="Todas"
      />
      {isLoading && <Loader />}
      {!isLoading && error && (
        <ErrorMessage message="No se pudieron cargar las recetas" onRetry={refetch} />
      )}
      {!isLoading && !error && (
        <FlatList
          data={recipes ?? []}
          keyExtractor={(item: Recipe) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="Sin recetas"
              description="Crea tu primera receta"
              action={
                <Button
                  label="Nueva receta"
                  onPress={() => router.push('/knowledge-base/recipes/new')}
                />
              }
            />
          }
        />
      )}
    </Screen>
  )
}

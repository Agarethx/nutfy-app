import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { Section } from '@/shared/components/layout/Section'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage'
import { Loader } from '@/shared/components/ui/Loader'
import { Badge } from '@/shared/components/ui/Badge'
import { Typography } from '@/shared/components/ui/Typography'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { useRecipe } from '../hooks/use-recipe'
import { useRecipeNutrition } from '../hooks/use-recipe-nutrition'
import type { RecipeIngredient, RecipeStep } from '../domain/recipe.types'
import type { CookingMethod } from '../domain/shared.types'
import { NutritionPanel } from '../components/NutritionPanel'

type Props = { id: string }

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
  EXPERT: 'Experto',
}

const COOKING_METHOD_LABEL: Record<string, string> = {
  RAW: 'Crudo', BAKE: 'Horno', GRILL: 'Parrilla', ROAST: 'Asado',
  STEAM: 'Vapor', BOIL: 'Hervido', SAUTE: 'Salteado', FRY: 'Frito',
  AIR_FRY: 'Air fryer', SLOW_COOK: 'Cocción lenta', PRESSURE_COOK: 'Olla a presión',
  MICROWAVE: 'Microondas', FERMENT: 'Fermentado', CURE: 'Curado', SOUS_VIDE: 'Sous vide',
}

export function RecipeDetailScreen({ id }: Props) {
  const router = useRouter()
  const { data: recipe, isLoading, error, refetch } = useRecipe(id)
  const { data: nutrition } = useRecipeNutrition(id)

  const menuRight = (
    <View className="flex-row gap-3">
      <Pressable
        onPress={() => router.push(`/knowledge-base/recipes/${id}/edit`)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="pencil-outline" size={22} color="#16a34a" />
      </Pressable>
    </View>
  )

  if (isLoading) return <Loader />
  if (error || !recipe) {
    return (
      <Screen>
        <Header title="Receta" showBack />
        {error ? (
          <ErrorMessage message="No se pudo cargar la receta" onRetry={refetch} />
        ) : (
          <EmptyState title="Receta no encontrada" />
        )}
      </Screen>
    )
  }

  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0) + (recipe.rest_time_min ?? 0)

  return (
    <Screen scroll withSafeArea={false}>
      <Header title={recipe.name} showBack right={menuRight} />

      <View className="px-4 pt-4 pb-10 gap-6">
        {recipe.description ? (
          <Typography variant="body" className="text-neutral-600">
            {recipe.description}
          </Typography>
        ) : null}

        <View className="flex-row gap-2 flex-wrap">
          <Badge label={DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty} variant="info" />
          {recipe.is_public && <Badge label="Pública" variant="success" />}
          {recipe.cooking_methods.map((m: CookingMethod) => (
            <Badge key={m} label={COOKING_METHOD_LABEL[m] ?? m} variant="default" />
          ))}
        </View>

        <View className="flex-row gap-6">
          <View className="items-center">
            <Ionicons name="people-outline" size={20} color="#737373" />
            <Typography variant="caption" className="mt-1">
              {recipe.servings_min === recipe.servings_max
                ? `${recipe.servings_min} pax`
                : `${recipe.servings_min}–${recipe.servings_max} pax`}
            </Typography>
          </View>
          {recipe.prep_time_min != null && (
            <View className="items-center">
              <Ionicons name="cut-outline" size={20} color="#737373" />
              <Typography variant="caption" className="mt-1">{recipe.prep_time_min} min prep</Typography>
            </View>
          )}
          {recipe.cook_time_min != null && (
            <View className="items-center">
              <Ionicons name="flame-outline" size={20} color="#737373" />
              <Typography variant="caption" className="mt-1">{recipe.cook_time_min} min cocción</Typography>
            </View>
          )}
          {totalTime > 0 && (
            <View className="items-center">
              <Ionicons name="time-outline" size={20} color="#737373" />
              <Typography variant="caption" className="mt-1">{totalTime} min total</Typography>
            </View>
          )}
        </View>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <Section title={`Ingredientes (${recipe.ingredients.length})`}>
            {recipe.ingredients.map((ri: RecipeIngredient) => (
              <View key={ri.id} className="flex-row justify-between py-2 border-b border-neutral-100">
                <Typography variant="body" className={ri.is_optional ? 'text-neutral-400' : ''}>
                  {ri.ingredient.name}
                  {ri.is_optional ? ' (opcional)' : ''}
                </Typography>
                <Typography variant="body" className="font-medium">
                  {ri.quantity} {ri.unit.name}
                </Typography>
              </View>
            ))}
          </Section>
        )}

        {recipe.steps && recipe.steps.length > 0 && (
          <Section title="Preparación">
            {recipe.steps.map((step: RecipeStep) => (
              <Card key={step.id} className="p-4 mb-3">
                <View className="flex-row gap-3">
                  <View className="w-7 h-7 rounded-full bg-primary-600 items-center justify-center shrink-0">
                    <Typography variant="label" className="text-white text-xs">
                      {step.step_number}
                    </Typography>
                  </View>
                  <View className="flex-1">
                    <Typography variant="body">{step.instruction}</Typography>
                    {step.duration_min != null && (
                      <Typography variant="caption" className="mt-2">
                        ⏱ {step.duration_min} min
                      </Typography>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </Section>
        )}

        {nutrition && (
          <Section title={`Nutrición por ración (${recipe.servings_min} pax)`}>
            <NutritionPanel nutrition={nutrition} perServings={recipe.servings_min} />
          </Section>
        )}

        {recipe.variations && recipe.variations.length > 0 && (
          <Button
            label={`Ver variantes (${recipe.variations.length})`}
            variant="secondary"
            fullWidth
            onPress={() => router.push(`/knowledge-base/recipes/${id}/variants`)}
          />
        )}

        <View className="flex-row gap-3">
          <Button
            label="Duplicar receta"
            variant="ghost"
            onPress={() => router.push(`/knowledge-base/recipes/${id}/duplicate`)}
          />
        </View>

        {recipe.notes ? (
          <Section title="Notas">
            <Typography variant="body" className="text-neutral-600">
              {recipe.notes}
            </Typography>
          </Section>
        ) : null}
      </View>
    </Screen>
  )
}

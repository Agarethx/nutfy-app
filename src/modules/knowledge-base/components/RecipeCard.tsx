import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/shared/components/ui/Card'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'
import type { Recipe } from '../domain/recipe.types'
import type { BadgeVariant } from './types'

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
  EXPERT: 'Experto',
}

const DIFFICULTY_VARIANT: Record<string, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
  EXPERT: 'danger',
}

type Props = {
  recipe: Recipe
  onPress?: () => void
}

export function RecipeCard({ recipe, onPress }: Props) {
  const router = useRouter()

  const handlePress = onPress ?? (() => router.push(`/knowledge-base/recipes/${recipe.id}`))
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)
  const servingsLabel =
    recipe.servings_min === recipe.servings_max
      ? `${recipe.servings_min} pax`
      : `${recipe.servings_min}–${recipe.servings_max} pax`

  return (
    <Pressable onPress={handlePress} className="mx-4 mb-3">
      <Card className="p-4">
        <View className="flex-row items-start justify-between gap-2">
          <Typography variant="title" className="flex-1">
            {recipe.name}
          </Typography>
          <Badge
            label={DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}
            variant={DIFFICULTY_VARIANT[recipe.difficulty] ?? 'default'}
          />
        </View>
        {recipe.description ? (
          <Typography variant="caption" className="mt-1" numberOfLines={2}>
            {recipe.description}
          </Typography>
        ) : null}
        <View className="flex-row gap-4 mt-2">
          <View className="flex-row items-center gap-1">
            <Ionicons name="people-outline" size={14} color="#737373" />
            <Typography variant="caption">{servingsLabel}</Typography>
          </View>
          {totalTime > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color="#737373" />
              <Typography variant="caption">{totalTime} min</Typography>
            </View>
          )}
          {recipe.is_public && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="globe-outline" size={14} color="#737373" />
              <Typography variant="caption">Pública</Typography>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  )
}

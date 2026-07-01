import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Card } from '@/shared/components/ui/Card'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'
import type { Ingredient } from '../domain/ingredient.types'

type Props = {
  ingredient: Ingredient
  onPress?: () => void
}

export function IngredientCard({ ingredient, onPress }: Props) {
  const router = useRouter()

  const handlePress = onPress ?? (() => router.push(`/knowledge-base/ingredients/${ingredient.id}`))

  const isInactive = ingredient.status !== 'ACTIVE'
  const cal = ingredient.nutrition.calories_kcal
  const protein = ingredient.nutrition.protein_g

  return (
    <Pressable onPress={handlePress} className="mx-4 mb-3">
      <Card className="p-4">
        <View className="flex-row items-start justify-between gap-2">
          <Typography variant="title" className="flex-1">
            {ingredient.name}
          </Typography>
          {isInactive && (
            <Badge
              label={ingredient.status === 'PENDING_REVIEW' ? 'Revisión' : ingredient.status}
              variant="warning"
            />
          )}
        </View>
        {ingredient.description ? (
          <Typography variant="caption" className="mt-1" numberOfLines={2}>
            {ingredient.description}
          </Typography>
        ) : null}
        <View className="flex-row gap-4 mt-2">
          {cal != null && (
            <Typography variant="caption">{cal} kcal</Typography>
          )}
          {protein != null && (
            <Typography variant="caption">{protein}g proteína</Typography>
          )}
        </View>
      </Card>
    </Pressable>
  )
}

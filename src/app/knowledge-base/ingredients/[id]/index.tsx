import { useLocalSearchParams } from 'expo-router'
import { IngredientDetailScreen } from '@/modules/knowledge-base/screens'

export default function IngredientDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <IngredientDetailScreen id={id} />
}

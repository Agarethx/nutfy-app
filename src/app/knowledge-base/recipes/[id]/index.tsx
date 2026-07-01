import { useLocalSearchParams } from 'expo-router'
import { RecipeDetailScreen } from '@/modules/knowledge-base/screens'

export default function RecipeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <RecipeDetailScreen id={id} />
}

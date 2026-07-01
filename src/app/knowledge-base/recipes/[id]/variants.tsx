import { useLocalSearchParams } from 'expo-router'
import { RecipeVariantsScreen } from '@/modules/knowledge-base/screens'

export default function RecipeVariantsPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <RecipeVariantsScreen id={id} />
}

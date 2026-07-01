import { useLocalSearchParams } from 'expo-router'
import { DuplicateRecipeScreen } from '@/modules/knowledge-base/screens'

export default function DuplicateRecipePage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DuplicateRecipeScreen id={id} />
}

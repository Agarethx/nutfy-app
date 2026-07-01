import { useLocalSearchParams } from 'expo-router'
import { EditRecipeScreen } from '@/modules/knowledge-base/screens'

export default function EditRecipePage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <EditRecipeScreen id={id} />
}

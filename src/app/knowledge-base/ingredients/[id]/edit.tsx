import { useLocalSearchParams } from 'expo-router'
import { EditIngredientScreen } from '@/modules/knowledge-base/screens'

export default function EditIngredientPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <EditIngredientScreen id={id} />
}

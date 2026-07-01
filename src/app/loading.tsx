import { Screen } from '@/shared/components/layout'
import { LoadingSpinner } from '@/shared/components/feedback'

export default function LoadingScreen() {
  return (
    <Screen>
      <LoadingSpinner message="Cargando..." />
    </Screen>
  )
}

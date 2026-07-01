import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '@/shared/components/layout'
import { EmptyState } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/Button'

export default function NotFoundScreen() {
  const router = useRouter()

  return (
    <Screen>
      <EmptyState
        title="Página no encontrada"
        description="La ruta que buscas no existe."
        icon={<Ionicons name="compass-outline" size={64} color="#a3a3a3" />}
        action={
          <Button
            label="Volver al inicio"
            onPress={() => router.replace('/')}
            variant="secondary"
          />
        }
      />
    </Screen>
  )
}

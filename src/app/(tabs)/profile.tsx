import { Screen } from '@/shared/components/layout'
import { EmptyState } from '@/shared/components/feedback'
import { Icon } from '@/shared/components/ui/Icon'

export default function ProfileScreen() {
  return (
    <Screen>
      <EmptyState
        title="Perfil"
        description="Pendiente — Módulo Profile (Fase 1)"
        icon={<Icon name="person-outline" size={56} color="#a3a3a3" />}
      />
    </Screen>
  )
}

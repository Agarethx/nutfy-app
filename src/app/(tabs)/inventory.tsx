import { Screen } from '@/shared/components/layout'
import { EmptyState } from '@/shared/components/feedback'
import { Icon } from '@/shared/components/ui/Icon'

export default function InventoryScreen() {
  return (
    <Screen>
      <EmptyState
        title="Despensa"
        description="Pendiente — Módulo Inventory (Fase 3)"
        icon={<Icon name="cube-outline" size={56} color="#a3a3a3" />}
      />
    </Screen>
  )
}

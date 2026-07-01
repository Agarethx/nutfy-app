import { Screen } from '@/shared/components/layout'
import { EmptyState } from '@/shared/components/feedback'
import { Icon } from '@/shared/components/ui/Icon'

export default function MealPlanScreen() {
  return (
    <Screen>
      <EmptyState
        title="Plan semanal"
        description="Pendiente — Módulo Meal Planner (Fase 5)"
        icon={<Icon name="calendar-outline" size={56} color="#a3a3a3" />}
      />
    </Screen>
  )
}

import { Screen } from '@/shared/components/layout'
import { EmptyState } from '@/shared/components/feedback'
import { Icon } from '@/shared/components/ui/Icon'
import { Button } from '@/shared/components/ui/Button'
import { supabase } from '@/shared/services/supabase'

export default function ProfileScreen() {
  return (
    <Screen>
      <EmptyState
        title="Perfil"
        description="Pendiente — Módulo Profile (Fase 1)"
        icon={<Icon name="person-outline" size={56} color="#a3a3a3" />}
        action={
          <Button
            label="Cerrar sesión"
            variant="danger"
            onPress={() => supabase.auth.signOut()}
          />
        }
      />
    </Screen>
  )
}

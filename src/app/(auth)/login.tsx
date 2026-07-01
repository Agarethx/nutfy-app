import { Text } from 'react-native'
import { Screen } from '@/shared/components'

export default function LoginScreen() {
  return (
    <Screen className="items-center justify-center">
      <Text className="text-2xl font-semibold text-neutral-900">
        Iniciar sesión
      </Text>
      <Text className="mt-2 text-sm text-neutral-500">
        Módulo Auth — pendiente (Fase 0)
      </Text>
    </Screen>
  )
}

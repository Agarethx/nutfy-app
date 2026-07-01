import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '@/shared/components/layout'
import { Typography } from '@/shared/components/ui/Typography'
import { Button } from '@/shared/components/ui/Button'
import { useAppStore } from '@/shared/stores/app.store'

export default function WelcomeScreen() {
  const router = useRouter()
  const { completeOnboarding } = useAppStore()

  function handleStart() {
    completeOnboarding()
    router.replace('/(auth)/login')
  }

  return (
    <Screen className="bg-primary-50">
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="items-center gap-3">
          <Typography variant="h1" className="text-center text-primary-700">
            Nutrition AI
          </Typography>
          <Typography variant="body" className="text-center text-neutral-600">
            Tu asistente personal de nutrición. Planifica, cocina y mejora tu
            alimentación con ayuda de la IA.
          </Typography>
        </View>
        <Button label="Comenzar" onPress={handleStart} fullWidth size="lg" />
      </View>
    </Screen>
  )
}

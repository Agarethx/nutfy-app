import { Redirect } from 'expo-router'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useAppStore } from '@/shared/stores/app.store'
import { LoadingSpinner } from '@/shared/components/feedback'

export default function RootIndex() {
  const { isLoading, session } = useAuthStore()
  const { isOnboardingComplete } = useAppStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isOnboardingComplete) {
    return <Redirect href="/welcome" />
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(tabs)" />
}

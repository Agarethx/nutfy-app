import { useEffect, useCallback } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryProvider } from '@/shared/providers/QueryProvider'
import { AuthProvider } from '@/shared/providers/AuthProvider'
import { ThemeProvider } from '@/shared/providers/ThemeProvider'
import { ErrorBoundary } from '@/shared/components/feedback'
import '../global.css'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    onLayoutRootView()
  }, [onLayoutRootView])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ErrorBoundary>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }} />
              </ErrorBoundary>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

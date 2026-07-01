import { type ReactNode, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import * as SystemUI from 'expo-system-ui'
import { useThemeStore } from '@/shared/stores/theme.store'
import { colors } from '@/shared/theme/colors'

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const { colorScheme } = useThemeStore()

  const resolved =
    colorScheme === 'system' ? (systemColorScheme ?? 'light') : colorScheme

  useEffect(() => {
    const bg = resolved === 'dark' ? colors.neutral[950] : colors.white
    SystemUI.setBackgroundColorAsync(bg)
  }, [resolved])

  return <>{children}</>
}

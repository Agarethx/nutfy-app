import { useColorScheme as useRNColorScheme } from 'react-native'
import { useThemeStore } from '@/shared/stores/theme.store'

export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme() ?? 'light'
  const { colorScheme } = useThemeStore()
  return colorScheme === 'system' ? system : colorScheme
}

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@/shared/lib/storage'

export type ColorScheme = 'light' | 'dark' | 'system'

type ThemeState = {
  colorScheme: ColorScheme
}

type ThemeActions = {
  setColorScheme: (colorScheme: ColorScheme) => void
}

type ThemeStore = ThemeState & ThemeActions

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      colorScheme: 'system',
      setColorScheme: (colorScheme) => set({ colorScheme }),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
)

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@/shared/lib/storage'

type AppState = {
  isOnboardingComplete: boolean
  lastSyncAt: string | null
}

type AppActions = {
  completeOnboarding: () => void
  setLastSyncAt: (timestamp: string) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      lastSyncAt: null,
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
)

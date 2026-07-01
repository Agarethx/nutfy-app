import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

type AuthState = {
  session: Session | null
  user: User | null
  isLoading: boolean
}

type AuthActions = {
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSession: () => set({ session: null, user: null, isLoading: false }),
}))

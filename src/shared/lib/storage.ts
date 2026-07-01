import { createMMKV, type MMKV } from 'react-native-mmkv'
import { type StateStorage } from 'zustand/middleware'

export const mmkv: MMKV = createMMKV({ id: 'nutrition-ai' })

export const mmkvStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => void mmkv.remove(key),
}

export const supabaseStorage = {
  getItem: (key: string): string | null => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string): void => mmkv.set(key, value),
  removeItem: (key: string): void => void mmkv.remove(key),
}

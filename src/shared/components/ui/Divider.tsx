import { View } from 'react-native'

type DividerProps = {
  className?: string
  vertical?: boolean
}

export function Divider({ className = '', vertical = false }: DividerProps) {
  if (vertical) {
    return <View className={`h-full w-px bg-neutral-200 ${className}`} />
  }
  return <View className={`h-px w-full bg-neutral-200 ${className}`} />
}

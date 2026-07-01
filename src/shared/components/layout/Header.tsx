import { type ReactNode } from 'react'
import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/shared/components/ui/Typography'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type HeaderProps = {
  title: string
  showBack?: boolean
  right?: ReactNode
}

export function Header({ title, showBack = false, right }: HeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-row items-center justify-between border-b border-neutral-100 bg-white px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="w-10">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color="#171717" />
          </Pressable>
        )}
      </View>

      <Typography variant="title" className="flex-1 text-center">
        {title}
      </Typography>

      <View className="w-10 items-end">{right}</View>
    </View>
  )
}

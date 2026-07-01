import { type ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ScreenProps = {
  children: ReactNode
  className?: string
  scroll?: boolean
  withSafeArea?: boolean
}

export function Screen({
  children,
  className = '',
  scroll = false,
  withSafeArea = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets()

  const paddingStyle = withSafeArea
    ? { paddingTop: insets.top, paddingBottom: insets.bottom }
    : undefined

  if (scroll) {
    return (
      <ScrollView
        className={`flex-1 bg-white ${className}`}
        contentContainerStyle={paddingStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View className={`flex-1 bg-white ${className}`} style={paddingStyle}>
      {children}
    </View>
  )
}

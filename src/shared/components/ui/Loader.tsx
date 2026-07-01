import { ActivityIndicator, View } from 'react-native'
import { colors } from '@/shared/theme/colors'

type LoaderProps = {
  size?: 'small' | 'large'
  color?: string
  centered?: boolean
  className?: string
}

export function Loader({
  size = 'large',
  color = colors.primary[600],
  centered = true,
  className = '',
}: LoaderProps) {
  if (centered) {
    return (
      <View className={`flex-1 items-center justify-center ${className}`}>
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }
  return <ActivityIndicator size={size} color={color} />
}

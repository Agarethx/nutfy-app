import { View, ActivityIndicator } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import { colors } from '@/shared/theme/colors'

type LoadingSpinnerProps = {
  message?: string
  className?: string
}

export function LoadingSpinner({
  message,
  className = '',
}: LoadingSpinnerProps) {
  return (
    <View className={`flex-1 items-center justify-center gap-3 ${className}`}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      {message && (
        <Typography variant="caption" className="text-neutral-400">
          {message}
        </Typography>
      )}
    </View>
  )
}

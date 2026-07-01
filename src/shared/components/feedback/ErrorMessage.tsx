import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/shared/components/ui/Typography'
import { Button } from '@/shared/components/ui/Button'

type ErrorMessageProps = {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({
  message,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <View
      className={`flex-1 items-center justify-center gap-4 px-8 ${className}`}
    >
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Typography variant="body" className="text-center text-neutral-600">
        {message}
      </Typography>
      {onRetry && (
        <Button
          label="Intentar de nuevo"
          onPress={onRetry}
          variant="secondary"
        />
      )}
    </View>
  )
}

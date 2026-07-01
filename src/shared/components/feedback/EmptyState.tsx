import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <View
      className={`flex-1 items-center justify-center gap-3 px-8 ${className}`}
    >
      {icon && <View className="mb-2">{icon}</View>}
      <Typography variant="title" className="text-center text-neutral-700">
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" className="text-center text-neutral-400">
          {description}
        </Typography>
      )}
      {action && <View className="mt-2">{action}</View>}
    </View>
  )
}

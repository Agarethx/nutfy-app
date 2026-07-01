import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'

type SectionProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <View className={`mb-6 ${className}`}>
      {title && (
        <Typography
          variant="label"
          className="mb-3 px-4 uppercase tracking-wider text-neutral-400"
        >
          {title}
        </Typography>
      )}
      {children}
    </View>
  )
}

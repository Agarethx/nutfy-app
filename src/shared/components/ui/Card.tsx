import { type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

type CardProps = ViewProps & {
  children: ReactNode
  className?: string
  elevated?: boolean
}

export function Card({
  children,
  className = '',
  elevated = false,
  ...props
}: CardProps) {
  return (
    <View
      className={`
        rounded-2xl bg-white
        ${elevated ? 'shadow-md shadow-neutral-200' : 'border border-neutral-100'}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  )
}

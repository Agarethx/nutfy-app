import { View } from 'react-native'
import { Typography } from './Typography'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<
  BadgeVariant,
  { container: string; text: string }
> = {
  default: { container: 'bg-neutral-100', text: 'text-neutral-700' },
  success: { container: 'bg-success-100', text: 'text-success-600' },
  warning: { container: 'bg-warning-100', text: 'text-warning-600' },
  danger: { container: 'bg-danger-100', text: 'text-danger-700' },
  info: { container: 'bg-primary-100', text: 'text-primary-700' },
}

export function Badge({
  label,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const { container, text } = variantClasses[variant]

  return (
    <View
      className={`rounded-full px-2.5 py-0.5 self-start ${container} ${className}`}
    >
      <Typography variant="overline" className={text}>
        {label}
      </Typography>
    </View>
  )
}

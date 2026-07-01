import { Pressable, type PressableProps, ActivityIndicator } from 'react-native'
import { Typography } from './Typography'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = PressableProps & {
  label: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary-600 active:bg-primary-700',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-neutral-100 active:bg-neutral-200',
    text: 'text-neutral-900',
  },
  ghost: {
    container: 'bg-transparent active:bg-neutral-100',
    text: 'text-primary-600',
  },
  danger: {
    container: 'bg-danger-600 active:bg-danger-700',
    text: 'text-white',
  },
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-lg',
  md: 'h-11 px-4 rounded-xl',
  lg: 'h-14 px-6 rounded-2xl',
}

const textSizeClasses: Record<Size, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const { container, text } = variantClasses[variant]

  return (
    <Pressable
      className={`
        flex-row items-center justify-center
        ${container}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : 'self-start'}
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'secondary' || variant === 'ghost'
              ? '#171717'
              : '#ffffff'
          }
        />
      ) : (
        <Typography
          variant="label"
          className={`${text} ${textSizeClasses[size]}`}
        >
          {label}
        </Typography>
      )}
    </Pressable>
  )
}

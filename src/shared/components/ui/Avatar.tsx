import { View, Image } from 'react-native'
import { Typography } from './Typography'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type AvatarProps = {
  uri?: string | null
  initials?: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<
  AvatarSize,
  { container: string; text: string; px: number }
> = {
  xs: { container: 'w-7 h-7', text: 'text-xs', px: 28 },
  sm: { container: 'w-9 h-9', text: 'text-sm', px: 36 },
  md: { container: 'w-12 h-12', text: 'text-base', px: 48 },
  lg: { container: 'w-16 h-16', text: 'text-xl', px: 64 },
  xl: { container: 'w-24 h-24', text: 'text-3xl', px: 96 },
}

export function Avatar({
  uri,
  initials,
  size = 'md',
  className = '',
}: AvatarProps) {
  const { container, text, px } = sizeClasses[size]

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`rounded-full ${container} ${className}`}
        width={px}
        height={px}
      />
    )
  }

  return (
    <View
      className={`rounded-full items-center justify-center bg-primary-100 ${container} ${className}`}
    >
      <Typography
        variant="label"
        className={`font-semibold text-primary-700 ${text}`}
      >
        {initials?.slice(0, 2).toUpperCase() ?? '?'}
      </Typography>
    </View>
  )
}

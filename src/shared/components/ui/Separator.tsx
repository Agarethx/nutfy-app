import { View } from 'react-native'

type SeparatorProps = {
  size?: number
  horizontal?: boolean
  className?: string
}

export function Separator({
  size = 4,
  horizontal = false,
  className = '',
}: SeparatorProps) {
  const style = horizontal
    ? { width: size, height: '100%' as const }
    : { height: size, width: '100%' as const }

  return <View style={style} className={className} />
}

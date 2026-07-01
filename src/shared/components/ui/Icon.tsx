import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

type IconProps = {
  name: IoniconsName
  size?: number
  color?: string
  className?: string
}

export function Icon({ name, size = 24, color = '#171717' }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />
}

import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

type SkeletonProps = {
  width?: number | `${number}%`
  height?: number
  rounded?: boolean
  className?: string
}

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = false,
  className = '',
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ width, height, opacity }}
      className={`bg-neutral-200 ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
    />
  )
}

type SkeletonRowProps = {
  lines?: number
  className?: string
}

export function SkeletonRow({ lines = 2, className = '' }: SkeletonRowProps) {
  return (
    <View className={`gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
        />
      ))}
    </View>
  )
}

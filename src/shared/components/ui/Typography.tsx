import { Text, type TextProps } from 'react-native'

type Variant =
  'h1' | 'h2' | 'h3' | 'title' | 'body' | 'caption' | 'label' | 'overline'

type TypographyProps = TextProps & {
  variant?: Variant
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  h1: 'text-4xl font-bold text-neutral-900',
  h2: 'text-3xl font-bold text-neutral-900',
  h3: 'text-2xl font-semibold text-neutral-900',
  title: 'text-lg font-semibold text-neutral-900',
  body: 'text-base font-normal text-neutral-700',
  caption: 'text-sm font-normal text-neutral-500',
  label: 'text-sm font-medium text-neutral-700',
  overline: 'text-xs font-medium uppercase tracking-widest text-neutral-400',
}

export function Typography({
  variant = 'body',
  className = '',
  children,
  ...props
}: TypographyProps) {
  return (
    <Text className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Text>
  )
}

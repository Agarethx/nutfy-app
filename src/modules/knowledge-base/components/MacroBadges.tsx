import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import type { NutritionalInfo } from '../domain/shared.types'

type MacroBadge = {
  label: string
  value: number | null | undefined
  unit: string
  bg: string
  text: string
}

type Props = {
  nutrition: NutritionalInfo
  size?: 'sm' | 'md'
  className?: string
}

function Pill({ label, value, unit, bg, text, size }: MacroBadge & { size: 'sm' | 'md' }) {
  if (value == null) return null
  const pad = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
  return (
    <View className={`rounded-full ${pad} ${bg}`}>
      <Typography variant={size === 'sm' ? 'overline' : 'label'} className={text}>
        {value}
        {unit} {label}
      </Typography>
    </View>
  )
}

const MACROS: MacroBadge[] = [
  { label: 'kcal', unit: '', bg: 'bg-neutral-100', text: 'text-neutral-700', value: undefined },
  { label: 'prot', unit: 'g', bg: 'bg-primary-100', text: 'text-primary-700', value: undefined },
  { label: 'carbs', unit: 'g', bg: 'bg-warning-100', text: 'text-warning-700', value: undefined },
  { label: 'grasa', unit: 'g', bg: 'bg-orange-100', text: 'text-orange-700', value: undefined },
]

export function MacroBadges({ nutrition, size = 'md', className = '' }: Props) {
  const values = [
    nutrition.calories_kcal,
    nutrition.protein_g,
    nutrition.carbs_g,
    nutrition.fat_g,
  ]

  return (
    <View className={`flex-row flex-wrap gap-1.5 ${className}`}>
      {MACROS.map((macro, i) => (
        <Pill key={macro.label} {...macro} value={values[i]} size={size} />
      ))}
    </View>
  )
}

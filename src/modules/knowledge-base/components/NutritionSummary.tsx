import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import type { NutritionalInfo } from '../domain/shared.types'

type MacroColumn = {
  label: string
  value: number | null | undefined
  unit: string
  color: string
}

type Props = {
  nutrition: NutritionalInfo
  compact?: boolean
  className?: string
}

function MacroCol({ label, value, unit, color, compact }: MacroColumn & { compact?: boolean }) {
  return (
    <View className="items-center flex-1">
      <Typography
        variant="label"
        className={`font-bold ${color} ${compact ? 'text-base' : 'text-lg'}`}
      >
        {value != null ? `${value}${unit}` : '—'}
      </Typography>
      <Typography variant="overline" className="text-neutral-400 mt-0.5">
        {label}
      </Typography>
    </View>
  )
}

export function NutritionSummary({ nutrition, compact = false, className = '' }: Props) {
  return (
    <View className={`flex-row ${className}`}>
      <MacroCol
        label="kcal"
        value={nutrition.calories_kcal}
        unit=""
        color="text-neutral-800"
        compact={compact}
      />
      <View className="w-px bg-neutral-100" />
      <MacroCol
        label="proteína"
        value={nutrition.protein_g}
        unit="g"
        color="text-primary-600"
        compact={compact}
      />
      <View className="w-px bg-neutral-100" />
      <MacroCol
        label="carbos"
        value={nutrition.carbs_g}
        unit="g"
        color="text-warning-600"
        compact={compact}
      />
      <View className="w-px bg-neutral-100" />
      <MacroCol
        label="grasas"
        value={nutrition.fat_g}
        unit="g"
        color="text-orange-500"
        compact={compact}
      />
    </View>
  )
}

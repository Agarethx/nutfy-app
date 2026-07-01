import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import type { NutritionalInfo } from '../domain/shared.types'

type RowProps = {
  label: string
  value: number | null | undefined
  unit: string
  indent?: boolean
}

function Row({ label, value, unit, indent }: RowProps) {
  return (
    <View className="flex-row justify-between py-2 border-b border-neutral-100">
      <Typography variant="body" className={indent ? 'pl-4 text-neutral-500' : ''}>
        {label}
      </Typography>
      <Typography variant="body" className="font-semibold">
        {value != null ? `${value}${unit}` : '—'}
      </Typography>
    </View>
  )
}

type Props = {
  nutrition: NutritionalInfo
  perServings?: number
}

export function NutritionPanel({ nutrition, perServings }: Props) {
  return (
    <View>
      {perServings != null && (
        <Typography variant="caption" className="mb-2 text-neutral-400">
          Por {perServings} ración{perServings !== 1 ? 'es' : ''}
        </Typography>
      )}
      <Row label="Calorías" value={nutrition.calories_kcal} unit=" kcal" />
      <Row label="Proteínas" value={nutrition.protein_g} unit="g" />
      <Row label="Carbohidratos" value={nutrition.carbs_g} unit="g" />
      <Row label="Azúcares" value={nutrition.sugar_g} unit="g" indent />
      <Row label="Grasas" value={nutrition.fat_g} unit="g" />
      <Row label="Grasas saturadas" value={nutrition.saturated_fat_g} unit="g" indent />
      <Row label="Fibra" value={nutrition.fiber_g} unit="g" />
      <Row label="Sodio" value={nutrition.sodium_mg} unit="mg" />
    </View>
  )
}

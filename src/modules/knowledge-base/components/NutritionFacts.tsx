import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import type { NutritionalInfo } from '../domain/shared.types'

type Props = {
  nutrition: NutritionalInfo
  servingSize?: string
  servings?: number
  className?: string
}

type RowProps = {
  label: string
  value: number | null | undefined
  unit: string
  bold?: boolean
  indent?: boolean
  separator?: boolean
  thick?: boolean
}

function Row({ label, value, unit, bold, indent, separator, thick }: RowProps) {
  const borderClass = thick
    ? 'border-b-4 border-neutral-900'
    : separator
    ? 'border-b-2 border-neutral-300'
    : 'border-b border-neutral-200'

  return (
    <View className={`flex-row justify-between py-1 ${borderClass}`}>
      <Typography
        variant="body"
        className={`${indent ? 'pl-4' : ''} ${bold ? 'font-bold text-neutral-900' : 'text-neutral-700'} text-sm`}
      >
        {label}
      </Typography>
      <Typography
        variant="body"
        className={`${bold ? 'font-bold text-neutral-900' : 'text-neutral-700'} text-sm`}
      >
        {value != null ? `${value} ${unit}` : '—'}
      </Typography>
    </View>
  )
}

export function NutritionFacts({ nutrition, servingSize, servings, className = '' }: Props) {
  return (
    <View className={`border-4 border-neutral-900 p-3 ${className}`}>
      <Typography variant="h3" className="font-black text-neutral-900 text-2xl leading-none">
        Información
      </Typography>
      <Typography variant="h3" className="font-black text-neutral-900 text-2xl leading-none mb-1">
        nutricional
      </Typography>

      {servings != null && (
        <Typography variant="caption" className="text-neutral-700">
          {servings} ración{servings !== 1 ? 'es' : ''} por envase
        </Typography>
      )}
      {servingSize && (
        <View className="flex-row justify-between border-b-4 border-neutral-900 pb-1 mb-1">
          <Typography variant="caption" className="text-neutral-700">
            Tamaño de ración
          </Typography>
          <Typography variant="label" className="font-bold">
            {servingSize}
          </Typography>
        </View>
      )}

      <View className="border-t-8 border-neutral-900 pt-1">
        <Typography variant="overline" className="text-neutral-500">
          Cantidad por ración
        </Typography>
        <View className="flex-row justify-between items-baseline border-b-4 border-neutral-900 pb-1">
          <Typography variant="label" className="text-neutral-900 font-bold">
            Calorías
          </Typography>
          <Typography className="text-4xl font-black text-neutral-900">
            {nutrition.calories_kcal ?? '—'}
          </Typography>
        </View>
      </View>

      <View className="flex-row justify-end border-b border-neutral-400 pb-0.5">
        <Typography variant="caption" className="font-bold text-neutral-700">
          % Valor diario*
        </Typography>
      </View>

      <Row label="Grasas totales" value={nutrition.fat_g} unit="g" bold thick />
      <Row label="Grasas saturadas" value={nutrition.saturated_fat_g} unit="g" indent />
      <Row label="Carbohidratos" value={nutrition.carbs_g} unit="g" bold />
      <Row label="Azúcares" value={nutrition.sugar_g} unit="g" indent />
      <Row label="Fibra dietética" value={nutrition.fiber_g} unit="g" indent />
      <Row label="Proteínas" value={nutrition.protein_g} unit="g" bold thick />
      <Row label="Sodio" value={nutrition.sodium_mg} unit="mg" />

      <Typography variant="caption" className="text-neutral-500 mt-2 text-xs">
        * Los porcentajes de valor diario están basados en una dieta de 2.000 kcal.
      </Typography>
    </View>
  )
}

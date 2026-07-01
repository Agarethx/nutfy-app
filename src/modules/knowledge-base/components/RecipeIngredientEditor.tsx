import { useState } from 'react'
import { View, Pressable, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/shared/components/ui/Input'
import { Typography } from '@/shared/components/ui/Typography'
import { IngredientSelector } from './IngredientSelector'
import type { Ingredient } from '../domain/ingredient.types'
import type { Unit } from '../domain/shared.types'

export type RecipeIngredientEditorValue = {
  ingredient_id: string
  unit_id: string
  quantity: number
  is_optional: boolean
  notes?: string
  _ingredient?: Ingredient | null
}

type Errors = {
  ingredient_id?: string
  unit_id?: string
  quantity?: string
}

type Props = {
  value: RecipeIngredientEditorValue
  onChange: (val: RecipeIngredientEditorValue) => void
  onRemove: () => void
  units: Unit[]
  errors?: Errors
  excludeIngredientIds?: string[]
}

export function RecipeIngredientEditor({
  value,
  onChange,
  onRemove,
  units,
  errors,
  excludeIngredientIds,
}: Props) {
  const [showNotes, setShowNotes] = useState(!!value.notes)

  const selectedUnit = units.find((u) => u.id === value.unit_id) ?? null

  function handleIngredientSelect(ingredient: Ingredient) {
    const defaultUnitId = ingredient.default_unit_id ?? units[0]?.id ?? ''
    onChange({
      ...value,
      ingredient_id: ingredient.id,
      unit_id: defaultUnitId,
      _ingredient: ingredient,
    })
  }

  function handleIngredientClear() {
    onChange({ ...value, ingredient_id: '', unit_id: '', _ingredient: null })
  }

  function handleQuantityChange(text: string) {
    const n = parseFloat(text)
    onChange({ ...value, quantity: Number.isNaN(n) ? 0 : n })
  }

  function handleUnitCycle() {
    if (units.length === 0) return
    const idx = units.findIndex((u) => u.id === value.unit_id)
    const next = units[(idx + 1) % units.length]
    onChange({ ...value, unit_id: next.id })
  }

  return (
    <View className="rounded-2xl border border-neutral-200 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <Typography variant="label" className="text-neutral-500">
          Ingrediente
        </Typography>
        <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
        </Pressable>
      </View>

      <View className="mb-3">
        <IngredientSelector
          value={value._ingredient ?? null}
          onSelect={handleIngredientSelect}
          onClear={handleIngredientClear}
          placeholder="Seleccionar ingrediente"
          error={errors?.ingredient_id}
          excludeIds={excludeIngredientIds}
        />
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Cantidad"
            placeholder="0"
            keyboardType="numeric"
            value={value.quantity > 0 ? String(value.quantity) : ''}
            onChangeText={handleQuantityChange}
            error={errors?.quantity}
          />
        </View>
        <View className="flex-1">
          <Typography variant="label" className="mb-1">
            Unidad
          </Typography>
          <Pressable
            onPress={handleUnitCycle}
            className={`h-11 rounded-xl border px-3 justify-center ${
              errors?.unit_id ? 'border-danger-500' : 'border-neutral-200'
            }`}
          >
            <Typography variant="body" className={selectedUnit ? 'text-neutral-900' : 'text-neutral-400'}>
              {selectedUnit ? `${selectedUnit.abbreviation} · ${selectedUnit.name}` : 'Sin unidad'}
            </Typography>
          </Pressable>
          {errors?.unit_id && (
            <Typography variant="caption" className="mt-1 text-danger-600">
              {errors.unit_id}
            </Typography>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center gap-2">
          <Switch
            value={value.is_optional}
            onValueChange={(v) => onChange({ ...value, is_optional: v })}
            trackColor={{ true: '#16a34a' }}
          />
          <Typography variant="caption">Opcional</Typography>
        </View>
        <Pressable onPress={() => setShowNotes((v) => !v)}>
          <Typography variant="caption" className="text-primary-600">
            {showNotes ? 'Ocultar notas' : 'Añadir notas'}
          </Typography>
        </Pressable>
      </View>

      {showNotes && (
        <View className="mt-3">
          <Input
            label="Notas"
            placeholder="Ej. Picado fino, a temperatura ambiente..."
            value={value.notes ?? ''}
            onChangeText={(t) => onChange({ ...value, notes: t || undefined })}
          />
        </View>
      )}
    </View>
  )
}

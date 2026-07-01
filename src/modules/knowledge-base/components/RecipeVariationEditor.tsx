import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/shared/components/ui/Input'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'

export type RecipeVariationEditorValue = {
  name: string
  description?: string
  servings_min?: number
  servings_max?: number
}

type Errors = Partial<Record<keyof RecipeVariationEditorValue, { message?: string }>>

type Props = {
  value: RecipeVariationEditorValue
  onChange: (val: RecipeVariationEditorValue) => void
  onRemove?: () => void
  index?: number
  errors?: Errors
}

export function RecipeVariationEditor({ value, onChange, onRemove, index, errors }: Props) {
  const label = index != null ? `Variante ${index + 1}` : 'Variante'

  return (
    <View className="rounded-2xl border border-neutral-200 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Badge label={label} variant="info" />
        </View>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </Pressable>
        )}
      </View>

      <View className="gap-3">
        <Input
          label="Nombre *"
          placeholder="Ej. Sin gluten, Versión vegana..."
          value={value.name}
          onChangeText={(t) => onChange({ ...value, name: t })}
          error={errors?.name?.message}
          autoCapitalize="words"
        />

        <Input
          label="Descripción"
          placeholder="Descripción opcional de la variante..."
          value={value.description ?? ''}
          onChangeText={(t) => onChange({ ...value, description: t || undefined })}
          error={errors?.description?.message}
          multiline
          numberOfLines={2}
          className="h-16 py-2"
          textAlignVertical="top"
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Raciones mín."
              placeholder="—"
              keyboardType="numeric"
              value={value.servings_min != null ? String(value.servings_min) : ''}
              onChangeText={(t) => {
                const n = parseInt(t)
                onChange({ ...value, servings_min: Number.isNaN(n) ? undefined : n })
              }}
              error={errors?.servings_min?.message}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Raciones máx."
              placeholder="—"
              keyboardType="numeric"
              value={value.servings_max != null ? String(value.servings_max) : ''}
              onChangeText={(t) => {
                const n = parseInt(t)
                onChange({ ...value, servings_max: Number.isNaN(n) ? undefined : n })
              }}
              error={errors?.servings_max?.message}
            />
          </View>
        </View>

        {value.servings_min != null &&
          value.servings_max != null &&
          value.servings_min > value.servings_max && (
            <Typography variant="caption" className="text-danger-600">
              Las raciones mínimas no pueden superar las máximas
            </Typography>
          )}
      </View>
    </View>
  )
}

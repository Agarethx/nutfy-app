import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/shared/components/ui/Input'
import { Typography } from '@/shared/components/ui/Typography'

export type RecipeStepEditorValue = {
  instruction: string
  duration_min?: number
}

type Errors = {
  instruction?: string
  duration_min?: string
}

type Props = {
  value: RecipeStepEditorValue
  onChange: (val: RecipeStepEditorValue) => void
  onRemove?: () => void
  stepNumber: number
  removable?: boolean
  errors?: Errors
}

export function RecipeStepEditor({
  value,
  onChange,
  onRemove,
  stepNumber,
  removable = true,
  errors,
}: Props) {
  return (
    <View className="rounded-2xl border border-neutral-200 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-primary-600 items-center justify-center">
            <Typography variant="label" className="text-white text-xs">
              {stepNumber}
            </Typography>
          </View>
          <Typography variant="label" className="text-neutral-500">
            Paso {stepNumber}
          </Typography>
        </View>
        {removable && onRemove && (
          <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </Pressable>
        )}
      </View>

      <View className="gap-3">
        <Input
          label="Instrucción *"
          placeholder="Describe este paso con detalle..."
          value={value.instruction}
          onChangeText={(t) => onChange({ ...value, instruction: t })}
          error={errors?.instruction}
          multiline
          numberOfLines={4}
          className="h-24 py-3"
          textAlignVertical="top"
        />
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Input
              label="Duración (min)"
              placeholder="—"
              keyboardType="numeric"
              value={value.duration_min != null ? String(value.duration_min) : ''}
              onChangeText={(t) => {
                const n = parseInt(t)
                onChange({ ...value, duration_min: Number.isNaN(n) ? undefined : n })
              }}
              error={errors?.duration_min}
            />
          </View>
          <View className="flex-1">
            {value.duration_min != null && (
              <View className="mt-6 flex-row items-center gap-1">
                <Ionicons name="time-outline" size={16} color="#737373" />
                <Typography variant="caption">
                  {value.duration_min >= 60
                    ? `${Math.floor(value.duration_min / 60)}h ${value.duration_min % 60}min`
                    : `${value.duration_min} min`}
                </Typography>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

import { useState } from 'react'
import { View, Pressable, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/shared/components/ui/Input'
import { Typography } from '@/shared/components/ui/Typography'
import { useSearchIngredients } from '../hooks/use-search-ingredients'
import type { Ingredient } from '../domain/ingredient.types'
import type { RecipeIngredientFormValues } from '../validation/recipe.schema'

type Props = {
  value: RecipeIngredientFormValues
  onChange: (val: RecipeIngredientFormValues) => void
  onRemove: () => void
  errors?: Partial<Record<keyof RecipeIngredientFormValues, { message?: string }>>
}

export function IngredientSearchRow({ value, onChange, onRemove, errors }: Props) {
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const { data: results } = useSearchIngredients(query)

  function handleSelect(ingredient: Ingredient) {
    setSelectedName(ingredient.name)
    setQuery('')
    setShowResults(false)
    onChange({
      ...value,
      ingredient_id: ingredient.id,
      unit_id: ingredient.default_unit_id ?? '',
    })
  }

  function handleClear() {
    setSelectedName(null)
    onChange({ ...value, ingredient_id: '', unit_id: '' })
  }

  return (
    <View className="mb-4 rounded-xl border border-neutral-200 p-3">
      <View className="flex-row items-center justify-between mb-2">
        <Typography variant="label">Ingrediente</Typography>
        <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
        </Pressable>
      </View>

      {selectedName ? (
        <View className="flex-row items-center justify-between bg-primary-50 rounded-xl px-3 py-2 mb-2">
          <Typography variant="body" className="flex-1 text-primary-800">
            {selectedName}
          </Typography>
          <Pressable onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color="#16a34a" />
          </Pressable>
        </View>
      ) : (
        <View className="mb-2">
          <Input
            placeholder="Buscar ingrediente..."
            value={query}
            onChangeText={(t) => {
              setQuery(t)
              setShowResults(true)
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            error={errors?.ingredient_id?.message}
          />
          {showResults && results && results.length > 0 && (
            <View className="border border-neutral-200 rounded-xl mt-1 overflow-hidden">
              {results.slice(0, 5).map((item: Ingredient) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  className="px-4 py-3 border-b border-neutral-100 active:bg-neutral-50"
                >
                  <Typography variant="body">{item.name}</Typography>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input
            label="Cantidad"
            placeholder="0"
            value={value.quantity > 0 ? String(value.quantity) : ''}
            onChangeText={(t) => onChange({ ...value, quantity: parseFloat(t) || 0 })}
            keyboardType="numeric"
            error={errors?.quantity?.message}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Notas (opcional)"
            placeholder="Picado fino..."
            value={value.notes ?? ''}
            onChangeText={(t) => onChange({ ...value, notes: t || undefined })}
          />
        </View>
      </View>
    </View>
  )
}

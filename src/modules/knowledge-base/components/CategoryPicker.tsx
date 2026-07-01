import { ScrollView, Pressable, View, ActivityIndicator } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import { useCategories } from '../hooks/use-categories'
import type { IngredientCategory } from '../domain/ingredient.types'

type Props = {
  value: string | null
  onChange: (categoryId: string | null) => void
  label?: string
  allowAll?: boolean
  error?: string
}

export function CategoryPicker({ value, onChange, label, allowAll = true, error }: Props) {
  const { data: categories, isLoading } = useCategories()

  return (
    <View className="w-full">
      {label && (
        <Typography variant="label" className="mb-2">
          {label}
        </Typography>
      )}
      {isLoading ? (
        <ActivityIndicator size="small" color="#16a34a" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {allowAll && (
            <Pressable
              onPress={() => onChange(null)}
              className={`rounded-full px-4 py-2 ${value === null ? 'bg-primary-600' : 'bg-neutral-100'}`}
            >
              <Typography
                variant="label"
                className={value === null ? 'text-white' : 'text-neutral-700'}
              >
                Todas
              </Typography>
            </Pressable>
          )}
          {(categories ?? []).map((cat: IngredientCategory) => (
            <Pressable
              key={cat.id}
              onPress={() => onChange(cat.id === value ? null : cat.id)}
              className={`rounded-full px-4 py-2 ${
                value === cat.id ? 'bg-primary-600' : 'bg-neutral-100'
              }`}
            >
              <Typography
                variant="label"
                className={value === cat.id ? 'text-white' : 'text-neutral-700'}
              >
                {cat.name}
              </Typography>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {error && (
        <Typography variant="caption" className="mt-1 text-danger-600">
          {error}
        </Typography>
      )}
    </View>
  )
}

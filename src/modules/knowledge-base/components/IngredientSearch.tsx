import { useState, useRef } from 'react'
import { View, TextInput, Pressable, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/shared/components/ui/Typography'
import { Loader } from '@/shared/components/ui/Loader'
import { useSearchIngredients } from '../hooks/use-search-ingredients'
import type { Ingredient } from '../domain/ingredient.types'

type Props = {
  onSelect: (ingredient: Ingredient) => void
  placeholder?: string
  autoFocus?: boolean
  excludeIds?: string[]
  className?: string
}

export function IngredientSearch({
  onSelect,
  placeholder = 'Buscar ingrediente...',
  autoFocus = false,
  excludeIds = [],
  className = '',
}: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<TextInput>(null)

  const { data: results, isFetching } = useSearchIngredients(query)

  const filtered = (results ?? []).filter((i: Ingredient) => !excludeIds.includes(i.id))

  function handleClear() {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <View className={`flex-1 ${className}`}>
      <View className="flex-row items-center border border-neutral-200 rounded-xl px-3 bg-neutral-50">
        <Ionicons name="search-outline" size={18} color="#737373" />
        <TextInput
          ref={inputRef}
          className="flex-1 h-11 px-2 text-base text-neutral-900"
          placeholder={placeholder}
          placeholderTextColor="#a3a3a3"
          value={query}
          onChangeText={setQuery}
          autoFocus={autoFocus}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#a3a3a3" />
          </Pressable>
        )}
        {isFetching && <Loader size="small" centered={false} color="#16a34a" />}
      </View>

      {query.trim().length >= 2 && (
        <FlatList
          data={filtered}
          keyExtractor={(item: Ingredient) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100 active:bg-neutral-50"
            >
              <View className="flex-1 mr-2">
                <Typography variant="body">{item.name}</Typography>
                {item.description ? (
                  <Typography variant="caption" numberOfLines={1}>
                    {item.description}
                  </Typography>
                ) : null}
              </View>
              {item.nutrition.calories_kcal != null && (
                <Typography variant="caption">{item.nutrition.calories_kcal} kcal</Typography>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            !isFetching ? (
              <View className="py-8 items-center">
                <Typography variant="caption">Sin resultados para "{query}"</Typography>
              </View>
            ) : null
          }
        />
      )}

      {query.trim().length < 2 && (
        <View className="py-8 items-center">
          <Typography variant="caption">Escribe al menos 2 caracteres</Typography>
        </View>
      )}
    </View>
  )
}

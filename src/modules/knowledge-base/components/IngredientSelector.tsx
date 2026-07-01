import { useState } from 'react'
import { Modal, View, Pressable, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/shared/components/ui/Typography'
import { IngredientSearch } from './IngredientSearch'
import type { Ingredient } from '../domain/ingredient.types'

type Props = {
  value: Ingredient | null
  onSelect: (ingredient: Ingredient) => void
  onClear?: () => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  excludeIds?: string[]
}

export function IngredientSelector({
  value,
  onSelect,
  onClear,
  label,
  placeholder = 'Seleccionar ingrediente',
  error,
  disabled = false,
  excludeIds,
}: Props) {
  const [open, setOpen] = useState(false)

  function handleSelect(ingredient: Ingredient) {
    onSelect(ingredient)
    setOpen(false)
  }

  return (
    <View className="w-full">
      {label && (
        <Typography variant="label" className="mb-1">
          {label}
        </Typography>
      )}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`
          flex-row items-center h-11 rounded-xl border px-3 justify-between
          ${error ? 'border-danger-500' : 'border-neutral-200'}
          ${disabled ? 'bg-neutral-50 opacity-60' : 'bg-white'}
        `}
      >
        {value ? (
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="leaf-outline" size={16} color="#16a34a" />
            <Typography variant="body" className="ml-2 text-neutral-900 flex-1" numberOfLines={1}>
              {value.name}
            </Typography>
          </View>
        ) : (
          <Typography variant="body" className="text-neutral-400 flex-1">
            {placeholder}
          </Typography>
        )}

        <View className="flex-row items-center gap-1">
          {value && onClear && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation()
                onClear()
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#a3a3a3" />
            </Pressable>
          )}
          <Ionicons name="chevron-down" size={16} color="#a3a3a3" />
        </View>
      </Pressable>

      {error && (
        <Typography variant="caption" className="mt-1 text-danger-600">
          {error}
        </Typography>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
              <Typography variant="title">Seleccionar ingrediente</Typography>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color="#171717" />
              </Pressable>
            </View>
            <View className="px-4 pt-3 flex-1">
              <IngredientSearch
                onSelect={handleSelect}
                autoFocus
                excludeIds={excludeIds}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}

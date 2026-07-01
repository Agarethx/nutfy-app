import { useState } from 'react'
import { Modal, View, Pressable, FlatList, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Loader } from '@/shared/components/ui/Loader'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'
import { useStorageMethods } from '../hooks/use-storage-methods'
import type { StorageMethod, StorageMethodType } from '../domain/shared.types'

const STORAGE_ICON: Record<StorageMethodType, string> = {
  FRIDGE: '🧊',
  FREEZER: '❄️',
  PANTRY: '🏠',
  COUNTER: '🍽️',
  COOL_DARK: '🌑',
  CELLAR: '🪣',
}

const STORAGE_LABEL: Record<StorageMethodType, string> = {
  FRIDGE: 'Nevera',
  FREEZER: 'Congelador',
  PANTRY: 'Despensa',
  COUNTER: 'Encimera',
  COOL_DARK: 'Lugar fresco',
  CELLAR: 'Bodega',
}

type Props = {
  value: string | null
  onChange: (methodId: string | null) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function StorageMethodPicker({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar método',
  error,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const { data: methods, isLoading } = useStorageMethods()

  const selected = (methods ?? []).find((m: StorageMethod) => m.id === value) ?? null

  function handleSelect(method: StorageMethod) {
    onChange(method.id)
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
          flex-row items-center h-11 rounded-xl border px-3 justify-between bg-white
          ${error ? 'border-danger-500' : 'border-neutral-200'}
          ${disabled ? 'opacity-60' : ''}
        `}
      >
        {selected ? (
          <View className="flex-row items-center gap-2 flex-1">
            <Typography>{STORAGE_ICON[selected.storage_type as StorageMethodType]}</Typography>
            <Typography variant="body" className="text-neutral-900">
              {selected.name}
            </Typography>
          </View>
        ) : (
          <Typography variant="body" className="text-neutral-400">
            {isLoading ? 'Cargando...' : placeholder}
          </Typography>
        )}
        <View className="flex-row items-center gap-1">
          {value && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#a3a3a3" />
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
          <SafeAreaView className="bg-white rounded-t-3xl" style={{ maxHeight: '60%' }}>
            <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
              <Typography variant="title">Método de conservación</Typography>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color="#171717" />
              </Pressable>
            </View>

            {isLoading ? (
              <Loader />
            ) : (
              <FlatList
                data={methods ?? []}
                keyExtractor={(m: StorageMethod) => m.id}
                renderItem={({ item }) => {
                  const isSelected = item.id === value
                  return (
                    <Pressable
                      onPress={() => handleSelect(item)}
                      className={`flex-row items-start justify-between px-4 py-3 border-b border-neutral-100 active:bg-neutral-50 ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <View className="flex-row items-start gap-3 flex-1">
                        <Typography className="text-xl">
                          {STORAGE_ICON[item.storage_type]}
                        </Typography>
                        <View className="flex-1">
                          <Typography variant="body" className={isSelected ? 'font-semibold' : ''}>
                            {item.name}
                          </Typography>
                          {item.description ? (
                            <Typography variant="caption" numberOfLines={2}>
                              {item.description}
                            </Typography>
                          ) : null}
                          {(item.typical_temp_min_c != null || item.typical_temp_max_c != null) && (
                            <Typography variant="caption" className="text-neutral-400">
                              {item.typical_temp_min_c != null ? `${item.typical_temp_min_c}°` : ''}
                              {item.typical_temp_min_c != null && item.typical_temp_max_c != null ? ' – ' : ''}
                              {item.typical_temp_max_c != null ? `${item.typical_temp_max_c}°C` : ''}
                            </Typography>
                          )}
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2 ml-2">
                        <Badge
                          label={STORAGE_LABEL[item.storage_type]}
                          variant="default"
                        />
                        {isSelected && <Ionicons name="checkmark" size={18} color="#16a34a" />}
                      </View>
                    </Pressable>
                  )
                }}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}

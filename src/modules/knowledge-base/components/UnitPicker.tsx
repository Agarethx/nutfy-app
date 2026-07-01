import { useState } from 'react'
import { Modal, View, Pressable, FlatList, SafeAreaView, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Loader } from '@/shared/components/ui/Loader'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'
import { useUnits } from '../hooks/use-units'
import type { Unit, UnitType } from '../domain/shared.types'

const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  WEIGHT: 'Peso',
  VOLUME: 'Volumen',
  PIECE: 'Pieza',
  CUSTOM: 'Personalizado',
}

const UNIT_TYPE_BADGE: Record<UnitType, 'default' | 'info' | 'success' | 'warning'> = {
  WEIGHT: 'info',
  VOLUME: 'success',
  PIECE: 'warning',
  CUSTOM: 'default',
}

type Props = {
  value: string | null
  onChange: (unitId: string | null) => void
  label?: string
  placeholder?: string
  filterType?: UnitType
  error?: string
  disabled?: boolean
}

export function UnitPicker({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar unidad',
  filterType,
  error,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { data: units, isLoading } = useUnits()

  const selectedUnit = (units ?? []).find((u: Unit) => u.id === value) ?? null

  const filtered = (units ?? []).filter((u: Unit) => {
    const matchesType = filterType ? u.unit_type === filterType : true
    const matchesQuery =
      query.length === 0 ||
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.abbreviation.toLowerCase().includes(query.toLowerCase())
    return matchesType && matchesQuery
  })

  function handleSelect(unit: Unit) {
    onChange(unit.id)
    setOpen(false)
    setQuery('')
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
        {selectedUnit ? (
          <View className="flex-row items-center gap-2 flex-1">
            <Typography variant="label" className="text-primary-700">
              {selectedUnit.abbreviation}
            </Typography>
            <Typography variant="body" className="text-neutral-700">
              {selectedUnit.name}
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
          <SafeAreaView className="bg-white rounded-t-3xl" style={{ maxHeight: '75%' }}>
            <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
              <Typography variant="title">Seleccionar unidad</Typography>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color="#171717" />
              </Pressable>
            </View>

            <View className="px-4 py-3">
              <View className="flex-row items-center border border-neutral-200 rounded-xl px-3 bg-neutral-50">
                <Ionicons name="search-outline" size={16} color="#737373" />
                <TextInput
                  className="flex-1 h-10 px-2 text-base text-neutral-900"
                  placeholder="Buscar unidad..."
                  placeholderTextColor="#a3a3a3"
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
              </View>
            </View>

            {isLoading ? (
              <Loader />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(u: Unit) => u.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    className={`flex-row items-center justify-between px-4 py-3 border-b border-neutral-100 active:bg-neutral-50 ${
                      item.id === value ? 'bg-primary-50' : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 items-center">
                        <Typography variant="label" className="text-primary-700 font-bold">
                          {item.abbreviation}
                        </Typography>
                      </View>
                      <Typography variant="body">{item.name}</Typography>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Badge
                        label={UNIT_TYPE_LABEL[item.unit_type]}
                        variant={UNIT_TYPE_BADGE[item.unit_type]}
                      />
                      {item.id === value && (
                        <Ionicons name="checkmark" size={18} color="#16a34a" />
                      )}
                    </View>
                  </Pressable>
                )}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}

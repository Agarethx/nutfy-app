import { View, Pressable, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/shared/components/ui/Typography'

type Props = {
  value: string | null
  onPickImage: () => void
  onRemove?: () => void
  label?: string
  aspectRatio?: number
  disabled?: boolean
  error?: string
}

export function ImageUploader({
  value,
  onPickImage,
  onRemove,
  label,
  aspectRatio = 16 / 9,
  disabled = false,
  error,
}: Props) {
  const height = 200

  return (
    <View className="w-full">
      {label && (
        <Typography variant="label" className="mb-2">
          {label}
        </Typography>
      )}

      {value ? (
        <View className="relative rounded-2xl overflow-hidden" style={{ height }}>
          <Image
            source={{ uri: value }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />
          <View className="absolute bottom-0 left-0 right-0 flex-row justify-end gap-2 p-3">
            <Pressable
              onPress={onPickImage}
              disabled={disabled}
              className="bg-white/90 rounded-xl px-3 py-2 flex-row items-center gap-1"
            >
              <Ionicons name="camera-outline" size={16} color="#171717" />
              <Typography variant="label" className="text-neutral-900">
                Cambiar
              </Typography>
            </Pressable>
            {onRemove && (
              <Pressable
                onPress={onRemove}
                disabled={disabled}
                className="bg-danger-600/90 rounded-xl px-3 py-2 flex-row items-center gap-1"
              >
                <Ionicons name="trash-outline" size={16} color="white" />
                <Typography variant="label" className="text-white">
                  Eliminar
                </Typography>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          onPress={onPickImage}
          disabled={disabled}
          className={`
            rounded-2xl border-2 border-dashed items-center justify-center gap-2
            ${error ? 'border-danger-400 bg-danger-50' : 'border-neutral-200 bg-neutral-50'}
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{ height }}
        >
          <View className="w-14 h-14 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="image-outline" size={28} color="#a3a3a3" />
          </View>
          <Typography variant="label" className="text-primary-600">
            Seleccionar imagen
          </Typography>
          <Typography variant="caption" className="text-neutral-400">
            JPG, PNG o WebP · Máx. 5 MB
          </Typography>
        </Pressable>
      )}

      {error && (
        <Typography variant="caption" className="mt-1 text-danger-600">
          {error}
        </Typography>
      )}
    </View>
  )
}

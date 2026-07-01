import { View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { Section } from '@/shared/components/layout/Section'
import { Loader } from '@/shared/components/ui/Loader'
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useRecipe } from '../hooks/use-recipe'
import { useUpdateRecipe } from '../hooks/use-update-recipe'
import { updateRecipeSchema, type UpdateRecipeFormValues } from '../validation/recipe.schema'
import { FilterChips } from '../components/FilterChips'
import type { DifficultyLevel } from '../domain/shared.types'

type Props = { id: string }

const DIFFICULTY_OPTIONS = [
  { value: 'EASY' as DifficultyLevel, label: 'Fácil' },
  { value: 'MEDIUM' as DifficultyLevel, label: 'Media' },
  { value: 'HARD' as DifficultyLevel, label: 'Difícil' },
  { value: 'EXPERT' as DifficultyLevel, label: 'Experto' },
]

export function EditRecipeScreen({ id }: Props) {
  const router = useRouter()
  const { data: recipe, isLoading, error, refetch } = useRecipe(id)
  const { mutate: updateRecipe, isPending } = useUpdateRecipe(id)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateRecipeFormValues>({
    resolver: zodResolver(updateRecipeSchema),
    values: recipe
      ? {
          name: recipe.name,
          description: recipe.description ?? '',
          servings_min: recipe.servings_min,
          servings_max: recipe.servings_max,
          difficulty: recipe.difficulty,
          prep_time_min: recipe.prep_time_min ?? undefined,
          cook_time_min: recipe.cook_time_min ?? undefined,
          rest_time_min: recipe.rest_time_min ?? undefined,
          source_url: recipe.source_url ?? '',
          notes: recipe.notes ?? '',
          is_public: recipe.is_public,
        }
      : undefined,
  })

  const selectedDifficulty = watch('difficulty') ?? 'MEDIUM'

  function onSubmit(values: UpdateRecipeFormValues) {
    updateRecipe(
      {
        name: values.name,
        description: values.description || undefined,
        servings_min: values.servings_min,
        servings_max: values.servings_max,
        difficulty: values.difficulty,
        prep_time_min: values.prep_time_min,
        cook_time_min: values.cook_time_min,
        rest_time_min: values.rest_time_min,
        source_url: values.source_url || undefined,
        notes: values.notes || undefined,
        is_public: values.is_public,
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Error', e.message),
      },
    )
  }

  if (isLoading) return <Loader />
  if (error) {
    return (
      <Screen>
        <Header title="Editar receta" showBack />
        <ErrorMessage message="No se pudo cargar la receta" onRetry={refetch} />
      </Screen>
    )
  }

  return (
    <Screen scroll withSafeArea={false}>
      <Header title="Editar receta" showBack />
      <View className="px-4 pt-4 pb-10 gap-6">

        <Section title="Información básica">
          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nombre *"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.name?.message}
                  autoCapitalize="words"
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Descripción"
                  value={value ?? ''}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  className="h-20 py-3"
                />
              )}
            />
          </View>
        </Section>

        <Section title="Dificultad">
          <FilterChips
            options={DIFFICULTY_OPTIONS}
            selected={selectedDifficulty as DifficultyLevel}
            onSelect={(v) => setValue('difficulty', v ?? 'MEDIUM')}
            allLabel=""
          />
        </Section>

        <Section title="Raciones">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="servings_min"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Mínimo"
                    keyboardType="numeric"
                    value={value != null ? String(value) : ''}
                    onChangeText={(t) => onChange(parseInt(t) || 1)}
                    error={errors.servings_min?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="servings_max"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Máximo"
                    keyboardType="numeric"
                    value={value != null ? String(value) : ''}
                    onChangeText={(t) => onChange(parseInt(t) || 1)}
                    error={errors.servings_max?.message}
                  />
                )}
              />
            </View>
          </View>
        </Section>

        <Section title="Tiempos (minutos)">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="prep_time_min"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Preparación"
                    keyboardType="numeric"
                    value={value != null ? String(value) : ''}
                    onChangeText={(t) => onChange(parseInt(t) || undefined)}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="cook_time_min"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Cocción"
                    keyboardType="numeric"
                    value={value != null ? String(value) : ''}
                    onChangeText={(t) => onChange(parseInt(t) || undefined)}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="rest_time_min"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Reposo"
                    keyboardType="numeric"
                    value={value != null ? String(value) : ''}
                    onChangeText={(t) => onChange(parseInt(t) || undefined)}
                  />
                )}
              />
            </View>
          </View>
        </Section>

        <Section title="Opciones">
          <View className="gap-3">
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Notas"
                  value={value ?? ''}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  className="h-20 py-3"
                />
              )}
            />
            <Controller
              control={control}
              name="source_url"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="URL de origen"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.source_url?.message}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              )}
            />
          </View>
        </Section>

        <Button
          label="Guardar cambios"
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  )
}

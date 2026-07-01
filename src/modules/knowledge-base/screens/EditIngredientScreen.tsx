import { useState } from 'react'
import { View, Alert, Pressable } from 'react-native'
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
import { Typography } from '@/shared/components/ui/Typography'
import { Ionicons } from '@expo/vector-icons'
import { useIngredient } from '../hooks/use-ingredient'
import { useUpdateIngredient } from '../hooks/use-update-ingredient'
import { updateIngredientSchema, type UpdateIngredientFormValues } from '../validation/ingredient.schema'

type Props = { id: string }

function NumericController({
  control,
  name,
  label,
  errors,
}: {
  control: any
  name: string
  label: string
  errors: any
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Input
          label={label}
          placeholder="0"
          keyboardType="numeric"
          value={value != null ? String(value) : ''}
          onChangeText={(t) => {
            const n = parseFloat(t)
            onChange(Number.isNaN(n) ? undefined : n)
          }}
          error={errors?.[name]?.message}
        />
      )}
    />
  )
}

export function EditIngredientScreen({ id }: Props) {
  const router = useRouter()
  const [showNutrition, setShowNutrition] = useState(false)

  const { data: ingredient, isLoading, error, refetch } = useIngredient(id)
  const { mutate: updateIngredient, isPending } = useUpdateIngredient(id)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateIngredientFormValues>({
    resolver: zodResolver(updateIngredientSchema),
    values: ingredient
      ? {
          name: ingredient.name,
          description: ingredient.description ?? '',
          nutrition: {
            calories_kcal: ingredient.nutrition.calories_kcal ?? undefined,
            protein_g: ingredient.nutrition.protein_g ?? undefined,
            carbs_g: ingredient.nutrition.carbs_g ?? undefined,
            sugar_g: ingredient.nutrition.sugar_g ?? undefined,
            fiber_g: ingredient.nutrition.fiber_g ?? undefined,
            fat_g: ingredient.nutrition.fat_g ?? undefined,
            saturated_fat_g: ingredient.nutrition.saturated_fat_g ?? undefined,
            sodium_mg: ingredient.nutrition.sodium_mg ?? undefined,
          },
        }
      : undefined,
  })

  function onSubmit(values: UpdateIngredientFormValues) {
    updateIngredient(
      {
        name: values.name,
        description: values.description || undefined,
        nutrition: values.nutrition,
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
        <Header title="Editar ingrediente" showBack />
        <ErrorMessage message="No se pudo cargar el ingrediente" onRetry={refetch} />
      </Screen>
    )
  }

  return (
    <Screen scroll withSafeArea={false}>
      <Header title="Editar ingrediente" showBack />
      <View className="px-4 pt-4 pb-10 gap-6">
        <Section title="Datos básicos">
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
                  error={errors.description?.message}
                  multiline
                  numberOfLines={3}
                  className="h-20 py-3"
                />
              )}
            />
          </View>
        </Section>

        <Pressable
          onPress={() => setShowNutrition((v) => !v)}
          className="flex-row items-center justify-between py-2"
        >
          <Typography variant="label" className="text-primary-700">
            Información nutricional (por 100g)
          </Typography>
          <Ionicons
            name={showNutrition ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#16a34a"
          />
        </Pressable>

        {showNutrition && (
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.calories_kcal"
                  label="Calorías (kcal)"
                  errors={errors.nutrition}
                />
              </View>
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.protein_g"
                  label="Proteínas (g)"
                  errors={errors.nutrition}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.carbs_g"
                  label="Carbohidratos (g)"
                  errors={errors.nutrition}
                />
              </View>
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.sugar_g"
                  label="Azúcares (g)"
                  errors={errors.nutrition}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.fat_g"
                  label="Grasas (g)"
                  errors={errors.nutrition}
                />
              </View>
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.saturated_fat_g"
                  label="Grasas sat. (g)"
                  errors={errors.nutrition}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.fiber_g"
                  label="Fibra (g)"
                  errors={errors.nutrition}
                />
              </View>
              <View className="flex-1">
                <NumericController
                  control={control}
                  name="nutrition.sodium_mg"
                  label="Sodio (mg)"
                  errors={errors.nutrition}
                />
              </View>
            </View>
          </View>
        )}

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

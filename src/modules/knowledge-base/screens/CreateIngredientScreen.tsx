import { useState } from 'react'
import { View, Alert, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { Section } from '@/shared/components/layout/Section'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Typography } from '@/shared/components/ui/Typography'
import { Ionicons } from '@expo/vector-icons'
import { useCreateIngredient } from '../hooks/use-create-ingredient'
import { createIngredientSchema, type CreateIngredientFormValues } from '../validation/ingredient.schema'

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

export function CreateIngredientScreen() {
  const router = useRouter()
  const [showNutrition, setShowNutrition] = useState(false)
  const { mutate: createIngredient, isPending } = useCreateIngredient()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateIngredientFormValues>({
    resolver: zodResolver(createIngredientSchema),
    defaultValues: { name: '', description: '' },
  })

  function onSubmit(values: CreateIngredientFormValues) {
    createIngredient(
      {
        name: values.name,
        description: values.description || undefined,
        nutrition: values.nutrition,
      },
      {
        onSuccess: (data) => router.replace(`/knowledge-base/ingredients/${data.id}`),
        onError: (e) => Alert.alert('Error', e.message),
      },
    )
  }

  return (
    <Screen scroll withSafeArea={false}>
      <Header title="Nuevo ingrediente" showBack />
      <View className="px-4 pt-4 pb-10 gap-6">
        <Section title="Datos básicos">
          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nombre *"
                  placeholder="Ej. Pechuga de pollo"
                  value={value}
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
                  placeholder="Descripción opcional"
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
            {(errors.nutrition as any)?.sugar_g && (
              <Typography variant="caption" className="text-danger-600">
                {(errors.nutrition as any).sugar_g.message}
              </Typography>
            )}
            {(errors.nutrition as any)?.saturated_fat_g && (
              <Typography variant="caption" className="text-danger-600">
                {(errors.nutrition as any).saturated_fat_g.message}
              </Typography>
            )}
          </View>
        )}

        <Button
          label="Crear ingrediente"
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  )
}

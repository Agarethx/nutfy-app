import { View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { Section } from '@/shared/components/layout/Section'
import { Loader } from '@/shared/components/ui/Loader'
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'
import { useRecipe } from '../hooks/use-recipe'
import { useCreateRecipe } from '../hooks/use-create-recipe'
import { createRecipeSchema, type CreateRecipeFormValues } from '../validation/recipe.schema'
import type { RecipeIngredient, RecipeStep } from '../domain/recipe.types'

type Props = { id: string }

export function DuplicateRecipeScreen({ id }: Props) {
  const router = useRouter()
  const { data: source, isLoading, error, refetch } = useRecipe(id)
  const { mutate: createRecipe, isPending } = useCreateRecipe()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRecipeFormValues>({
    resolver: zodResolver(createRecipeSchema),
    values: source
      ? {
          name: `Copia de ${source.name}`,
          description: source.description ?? '',
          servings_min: source.servings_min,
          servings_max: source.servings_max,
          difficulty: source.difficulty,
          cooking_methods: source.cooking_methods,
          prep_time_min: source.prep_time_min ?? undefined,
          cook_time_min: source.cook_time_min ?? undefined,
          rest_time_min: source.rest_time_min ?? undefined,
          notes: source.notes ?? '',
          source_url: source.source_url ?? '',
          is_public: false,
          ingredients: source.ingredients.map((ri: RecipeIngredient) => ({
            ingredient_id: ri.ingredient_id,
            unit_id: ri.unit_id,
            quantity: ri.quantity,
            is_optional: ri.is_optional,
            notes: ri.notes ?? undefined,
          })),
          steps: source.steps.map((s: RecipeStep) => ({
            instruction: s.instruction,
            duration_min: s.duration_min ?? undefined,
          })),
        }
      : undefined,
  })

  const { fields: ingredientFields } = useFieldArray({ control, name: 'ingredients' })
  const { fields: stepFields } = useFieldArray({ control, name: 'steps' })

  function onSubmit(values: CreateRecipeFormValues) {
    createRecipe(
      {
        ...values,
        description: values.description || undefined,
        source_url: values.source_url || undefined,
        notes: values.notes || undefined,
        is_public: values.is_public ?? false,
      },
      {
        onSuccess: (data) => router.replace(`/knowledge-base/recipes/${data.id}`),
        onError: (e) => Alert.alert('Error', e.message),
      },
    )
  }

  if (isLoading) return <Loader />
  if (error) {
    return (
      <Screen>
        <Header title="Duplicar receta" showBack />
        <ErrorMessage message="No se pudo cargar la receta" onRetry={refetch} />
      </Screen>
    )
  }

  return (
    <Screen scroll withSafeArea={false}>
      <Header title="Duplicar receta" showBack />
      <View className="px-4 pt-4 pb-10 gap-6">
        <View className="bg-primary-50 rounded-xl p-4 flex-row gap-2 items-start">
          <Typography variant="caption" className="flex-1 text-primary-700">
            Se creará una copia de "{source?.name}". Puedes cambiar el nombre antes de guardar.
          </Typography>
        </View>

        <Section title="Nombre de la copia">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nombre *"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                autoCapitalize="words"
              />
            )}
          />
        </Section>

        <Section title={`Ingredientes (${ingredientFields.length})`}>
          {source?.ingredients.map((ri: RecipeIngredient) => (
            <View key={ri.id} className="flex-row justify-between py-2 border-b border-neutral-100">
              <Typography variant="body">{ri.ingredient.name}</Typography>
              <Typography variant="body" className="font-medium text-neutral-500">
                {ri.quantity} {ri.unit.name}
              </Typography>
            </View>
          ))}
        </Section>

        <Section title={`Pasos (${stepFields.length})`}>
          {source?.steps.map((step: RecipeStep) => (
            <View key={step.id} className="flex-row gap-3 py-2 border-b border-neutral-100">
              <Badge label={String(step.step_number)} variant="default" />
              <Typography variant="body" className="flex-1" numberOfLines={2}>
                {step.instruction}
              </Typography>
            </View>
          ))}
        </Section>

        <Button
          label="Crear copia"
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  )
}

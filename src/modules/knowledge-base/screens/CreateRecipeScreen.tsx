import { View, Alert, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { Section } from '@/shared/components/layout/Section'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Typography } from '@/shared/components/ui/Typography'
import { Ionicons } from '@expo/vector-icons'
import { useCreateRecipe } from '../hooks/use-create-recipe'
import { createRecipeSchema, type CreateRecipeFormValues } from '../validation/recipe.schema'
import { IngredientSearchRow } from '../components/IngredientSearchRow'
import { FilterChips } from '../components/FilterChips'
import type { DifficultyLevel } from '../domain/shared.types'

const DIFFICULTY_OPTIONS = [
  { value: 'EASY' as DifficultyLevel, label: 'Fácil' },
  { value: 'MEDIUM' as DifficultyLevel, label: 'Media' },
  { value: 'HARD' as DifficultyLevel, label: 'Difícil' },
  { value: 'EXPERT' as DifficultyLevel, label: 'Experto' },
]

const DEFAULT_INGREDIENT = { ingredient_id: '', unit_id: '', quantity: 0, is_optional: false }
const DEFAULT_STEP = { instruction: '', duration_min: undefined }

export function CreateRecipeScreen() {
  const router = useRouter()
  const { mutate: createRecipe, isPending } = useCreateRecipe()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRecipeFormValues>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      name: '',
      description: '',
      servings_min: 1,
      servings_max: 2,
      difficulty: 'MEDIUM',
      is_public: false,
      ingredients: [{ ...DEFAULT_INGREDIENT }],
      steps: [{ ...DEFAULT_STEP }],
    },
  })

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    update: updateIngredient,
  } = useFieldArray({ control, name: 'ingredients' })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'steps' })

  const selectedDifficulty = watch('difficulty') ?? 'MEDIUM'

  function onSubmit(values: CreateRecipeFormValues) {
    createRecipe(
      {
        name: values.name,
        description: values.description || undefined,
        servings_min: values.servings_min,
        servings_max: values.servings_max,
        difficulty: values.difficulty,
        cooking_methods: values.cooking_methods,
        prep_time_min: values.prep_time_min,
        cook_time_min: values.cook_time_min,
        rest_time_min: values.rest_time_min,
        source_url: values.source_url || undefined,
        notes: values.notes || undefined,
        is_public: values.is_public ?? false,
        ingredients: values.ingredients.map((i) => ({
          ingredient_id: i.ingredient_id,
          unit_id: i.unit_id,
          quantity: i.quantity,
          is_optional: i.is_optional,
          notes: i.notes,
        })),
        steps: values.steps.map((s) => ({
          instruction: s.instruction,
          duration_min: s.duration_min,
        })),
      },
      {
        onSuccess: (data) => router.replace(`/knowledge-base/recipes/${data.id}`),
        onError: (e) => Alert.alert('Error', e.message),
      },
    )
  }

  return (
    <Screen scroll withSafeArea={false}>
      <Header title="Nueva receta" showBack />
      <View className="px-4 pt-4 pb-10 gap-6">

        <Section title="Información básica">
          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nombre *"
                  placeholder="Ej. Pollo al curry"
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
                    label="Mínimo *"
                    placeholder="1"
                    keyboardType="numeric"
                    value={value ? String(value) : ''}
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
                    label="Máximo *"
                    placeholder="2"
                    keyboardType="numeric"
                    value={value ? String(value) : ''}
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
                    placeholder="0"
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
                    placeholder="0"
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
                    placeholder="0"
                    keyboardType="numeric"
                    value={value != null ? String(value) : ''}
                    onChangeText={(t) => onChange(parseInt(t) || undefined)}
                  />
                )}
              />
            </View>
          </View>
        </Section>

        <Section title="Ingredientes">
          {ingredientFields.map((field, index) => (
            <IngredientSearchRow
              key={field.id}
              value={watch(`ingredients.${index}`)}
              onChange={(val) => updateIngredient(index, val)}
              onRemove={() => ingredientFields.length > 1 && removeIngredient(index)}
              errors={errors.ingredients?.[index] as any}
            />
          ))}
          {errors.ingredients?.root && (
            <Typography variant="caption" className="text-danger-600 mb-2">
              {errors.ingredients.root.message}
            </Typography>
          )}
          <Button
            label="Agregar ingrediente"
            variant="ghost"
            size="sm"
            onPress={() => appendIngredient({ ...DEFAULT_INGREDIENT })}
          />
        </Section>

        <Section title="Pasos">
          {stepFields.map((field, index) => (
            <View key={field.id} className="mb-4 rounded-xl border border-neutral-200 p-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-7 h-7 rounded-full bg-primary-100 items-center justify-center">
                  <Typography variant="label" className="text-primary-700 text-xs">
                    {index + 1}
                  </Typography>
                </View>
                {stepFields.length > 1 && (
                  <Pressable onPress={() => removeStep(index)}>
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </Pressable>
                )}
              </View>
              <View className="gap-3">
                <Controller
                  control={control}
                  name={`steps.${index}.instruction`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Instrucción *"
                      placeholder="Describe este paso..."
                      value={value}
                      onChangeText={onChange}
                      error={errors.steps?.[index]?.instruction?.message}
                      multiline
                      numberOfLines={3}
                      className="h-20 py-3"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`steps.${index}.duration_min`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Duración (min)"
                      placeholder="0"
                      keyboardType="numeric"
                      value={value != null ? String(value) : ''}
                      onChangeText={(t) => onChange(parseInt(t) || undefined)}
                    />
                  )}
                />
              </View>
            </View>
          ))}
          {errors.steps?.root && (
            <Typography variant="caption" className="text-danger-600 mb-2">
              {errors.steps.root.message}
            </Typography>
          )}
          <Button
            label="Agregar paso"
            variant="ghost"
            size="sm"
            onPress={() => appendStep({ ...DEFAULT_STEP })}
          />
        </Section>

        <Section title="Opciones">
          <View className="gap-3">
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Notas"
                  placeholder="Notas adicionales..."
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
                  placeholder="https://..."
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
          label="Crear receta"
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  )
}

import { View } from 'react-native'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage'
import { Loader } from '@/shared/components/ui/Loader'
import { Card } from '@/shared/components/ui/Card'
import { Typography } from '@/shared/components/ui/Typography'
import { Badge } from '@/shared/components/ui/Badge'
import { useRecipe } from '../hooks/use-recipe'
import type { RecipeVariation, VariationIngredientOverride } from '../domain/recipe.types'

type Props = { id: string }

const OVERRIDE_LABEL: Record<string, string> = {
  SUBSTITUTE: 'Sustituir',
  ADD: 'Añadir',
  REMOVE: 'Eliminar',
  MODIFY_QUANTITY: 'Cambiar cantidad',
}

export function RecipeVariantsScreen({ id }: Props) {
  const { data: recipe, isLoading, error, refetch } = useRecipe(id)

  if (isLoading) return <Loader />

  const variants = recipe?.variations ?? []

  return (
    <Screen scroll withSafeArea={false}>
      <Header title="Variantes" showBack />
      {error && <ErrorMessage message="No se pudo cargar la receta" onRetry={refetch} />}
      {!error && variants.length === 0 && (
        <EmptyState
          title="Sin variantes"
          description="Esta receta no tiene variantes todavía"
        />
      )}
      {!error && variants.length > 0 && (
        <View className="px-4 pt-4 pb-10 gap-4">
          <Typography variant="caption" className="text-neutral-400">
            Variantes de "{recipe?.name}"
          </Typography>
          {variants.map((variant: RecipeVariation) => (
            <Card key={variant.id} className="p-4">
              <View className="flex-row items-start justify-between gap-2 mb-2">
                <Typography variant="title" className="flex-1">
                  {variant.name}
                </Typography>
                <Badge
                  label={variant.status === 'ACTIVE' ? 'Activa' : variant.status}
                  variant={variant.status === 'ACTIVE' ? 'success' : 'warning'}
                />
              </View>
              {variant.description ? (
                <Typography variant="body" className="text-neutral-600 mb-3">
                  {variant.description}
                </Typography>
              ) : null}
              {variant.servings_min != null && variant.servings_max != null && (
                <Typography variant="caption" className="mb-2">
                  {variant.servings_min === variant.servings_max
                    ? `${variant.servings_min} pax`
                    : `${variant.servings_min}–${variant.servings_max} pax`}
                </Typography>
              )}
              {variant.overrides.length > 0 && (
                <View className="gap-1 mt-2">
                  <Typography variant="overline">Cambios</Typography>
                  {variant.overrides.map((ov: VariationIngredientOverride) => (
                    <View key={ov.id} className="flex-row gap-2 py-1">
                      <Badge
                        label={OVERRIDE_LABEL[ov.override_type] ?? ov.override_type}
                        variant="info"
                      />
                      {ov.new_quantity != null && (
                        <Typography variant="caption">
                          ×{ov.new_quantity}
                        </Typography>
                      )}
                      {ov.notes ? (
                        <Typography variant="caption" className="flex-1">
                          {ov.notes}
                        </Typography>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  )
}

import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '@/shared/components/layout/Screen'
import { Header } from '@/shared/components/layout/Header'
import { Section } from '@/shared/components/layout/Section'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage'
import { Loader } from '@/shared/components/ui/Loader'
import { Badge } from '@/shared/components/ui/Badge'
import type { IngredientAllergen, IngredientMicronutrient, IngredientStorageRule } from '../domain/ingredient.types'
import { Typography } from '@/shared/components/ui/Typography'
import { Card } from '@/shared/components/ui/Card'
import { useIngredient } from '../hooks/use-ingredient'
import { NutritionPanel } from '../components/NutritionPanel'

type Props = { id: string }

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function IngredientDetailScreen({ id }: Props) {
  const router = useRouter()
  const { data: ingredient, isLoading, error, refetch } = useIngredient(id)

  const editButton = (
    <Pressable
      onPress={() => router.push(`/knowledge-base/ingredients/${id}/edit`)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="pencil-outline" size={22} color="#16a34a" />
    </Pressable>
  )

  if (isLoading) return <Loader />
  if (error || !ingredient) {
    return (
      <Screen>
        <Header title="Ingrediente" showBack />
        {error ? (
          <ErrorMessage message="No se pudo cargar el ingrediente" onRetry={refetch} />
        ) : (
          <EmptyState title="Ingrediente no encontrado" />
        )}
      </Screen>
    )
  }

  const seasonMonths = ingredient.seasonality.months ?? []

  return (
    <Screen scroll withSafeArea={false}>
      <Header title={ingredient.name} showBack right={!ingredient.is_system ? editButton : undefined} />

      <View className="px-4 pt-4 pb-6 gap-6">
        {ingredient.description ? (
          <Typography variant="body" className="text-neutral-600">
            {ingredient.description}
          </Typography>
        ) : null}

        <View className="flex-row gap-2 flex-wrap">
          {ingredient.is_system && <Badge label="Sistema" variant="info" />}
          <Badge
            label={ingredient.status === 'ACTIVE' ? 'Activo' : ingredient.status === 'PENDING_REVIEW' ? 'En revisión' : 'Inactivo'}
            variant={ingredient.status === 'ACTIVE' ? 'success' : 'warning'}
          />
        </View>

        <Section title="Información nutricional (por 100g)">
          <NutritionPanel nutrition={ingredient.nutrition} />
        </Section>

        {ingredient.allergens && ingredient.allergens.length > 0 && (
          <Section title="Alérgenos">
            <View className="flex-row flex-wrap gap-2">
              {ingredient.allergens.map((a: IngredientAllergen) => (
                <Badge
                  key={a.allergen_id}
                  label={a.is_trace ? `${a.allergen.name} (traza)` : a.allergen.name}
                  variant={a.is_trace ? 'warning' : 'danger'}
                />
              ))}
            </View>
          </Section>
        )}

        {seasonMonths.length > 0 && (
          <Section title="Temporada">
            <View className="flex-row flex-wrap gap-2">
              {seasonMonths.map((m: number) => (
                <Badge key={m} label={MONTH_NAMES[m - 1] ?? String(m)} variant="success" />
              ))}
            </View>
          </Section>
        )}

        {ingredient.storage_rules && ingredient.storage_rules.length > 0 && (
          <Section title="Conservación">
            {ingredient.storage_rules.map((rule: IngredientStorageRule) => (
              <Card key={rule.id} className="p-3 mb-2">
                <View className="flex-row items-center justify-between">
                  <Typography variant="label">{rule.storage_method.name}</Typography>
                  {rule.is_recommended && <Badge label="Recomendado" variant="success" />}
                </View>
                <Typography variant="caption" className="mt-1">
                  Máx. {rule.max_duration} {rule.duration_unit.toLowerCase()}
                  {rule.can_freeze ? ' · Se puede congelar' : ''}
                </Typography>
                {rule.notes ? (
                  <Typography variant="caption" className="mt-1 text-neutral-400">
                    {rule.notes}
                  </Typography>
                ) : null}
              </Card>
            ))}
          </Section>
        )}

        {ingredient.countries.length > 0 && (
          <Section title="Países de origen">
            <View className="flex-row flex-wrap gap-2">
              {ingredient.countries.map((c: string) => (
                <Badge key={c} label={c} variant="default" />
              ))}
            </View>
          </Section>
        )}
      </View>
    </Screen>
  )
}

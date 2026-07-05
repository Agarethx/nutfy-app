import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useURL } from 'expo-linking'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout'
import { Typography, Button, Input } from '@/shared/components/ui'
import { LoadingSpinner } from '@/shared/components/feedback'
import { supabase } from '@/shared/services/supabase'
import { mapAuthError } from '@/shared/utils/supabase-auth-error'
import { getErrorMessage } from '@/shared/utils/error-messages'
import { parseRecoveryTokensFromUrl } from '@/shared/lib/auth-deep-link'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/shared/validation/auth.schema'

// Ruta top-level (fuera de (auth)/) para que el deep link
// nutrition-ai://reset-password resuelva exactamente a esta pantalla.
export default function ResetPasswordScreen() {
  const router = useRouter()
  const url = useURL()
  const [sessionReady, setSessionReady] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!url || sessionReady || linkError) return

    const tokens = parseRecoveryTokensFromUrl(url)
    if (!tokens) {
      setLinkError('Este enlace no es válido o ya expiró. Solicita uno nuevo.')
      return
    }

    supabase.auth.setSession(tokens).then(({ error }) => {
      if (error) {
        setLinkError(getErrorMessage(mapAuthError(error)))
        return
      }
      setSessionReady(true)
    })
  }, [url, sessionReady, linkError])

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setFormError(getErrorMessage(mapAuthError(error)))
      return
    }
    setDone(true)
  }

  if (linkError) {
    return (
      <Screen className="items-center justify-center px-8">
        <Typography variant="h3" className="text-center">
          Enlace inválido
        </Typography>
        <Typography variant="body" className="mt-2 text-center text-neutral-500">
          {linkError}
        </Typography>
        <Button
          label="Volver a iniciar sesión"
          variant="secondary"
          className="mt-6"
          onPress={() => router.replace('/(auth)/login')}
        />
      </Screen>
    )
  }

  if (done) {
    return (
      <Screen className="items-center justify-center px-8">
        <Typography variant="h3" className="text-center">
          Contraseña actualizada
        </Typography>
        <Typography variant="body" className="mt-2 text-center text-neutral-500">
          Ya puedes usar tu nueva contraseña.
        </Typography>
        <Button
          label="Continuar"
          className="mt-6"
          onPress={() => router.replace('/')}
        />
      </Screen>
    )
  }

  if (!sessionReady) {
    return (
      <Screen>
        <LoadingSpinner message="Verificando enlace..." />
      </Screen>
    )
  }

  return (
    <Screen scroll className="px-6">
      <View className="flex-1 justify-center gap-6 py-12">
        <View className="gap-1">
          <Typography variant="h2">Nueva contraseña</Typography>
          <Typography variant="body" className="text-neutral-500">
            Elige una contraseña nueva para tu cuenta
          </Typography>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nueva contraseña"
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmar contraseña"
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />
        </View>

        {formError && (
          <Typography variant="caption" className="text-center text-danger-600">
            {formError}
          </Typography>
        )}

        <Button
          label="Guardar contraseña"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  )
}

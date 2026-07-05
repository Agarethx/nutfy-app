import { useState } from 'react'
import { View } from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout'
import { Typography, Button, Input } from '@/shared/components/ui'
import { supabase } from '@/shared/services/supabase'
import { mapAuthError } from '@/shared/utils/supabase-auth-error'
import { getErrorMessage } from '@/shared/utils/error-messages'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/shared/validation/auth.schema'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: Linking.createURL('reset-password'),
    })
    if (error) {
      setFormError(getErrorMessage(mapAuthError(error)))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Screen className="items-center justify-center px-8">
        <Typography variant="h3" className="text-center">
          Revisa tu correo
        </Typography>
        <Typography variant="body" className="mt-2 text-center text-neutral-500">
          Si existe una cuenta con ese correo, te enviamos un enlace para
          restablecer tu contraseña.
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

  return (
    <Screen scroll className="px-6">
      <View className="flex-1 justify-center gap-6 py-12">
        <View className="gap-1">
          <Typography variant="h2">Recuperar contraseña</Typography>
          <Typography variant="body" className="text-neutral-500">
            Te enviaremos un enlace a tu correo para crear una nueva contraseña
          </Typography>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Correo"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        {formError && (
          <Typography variant="caption" className="text-center text-danger-600">
            {formError}
          </Typography>
        )}

        <Button
          label="Enviar enlace"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="lg"
        />

        <Typography
          variant="body"
          className="text-center font-semibold text-primary-600"
          onPress={() => router.push('/(auth)/login')}
        >
          Volver a iniciar sesión
        </Typography>
      </View>
    </Screen>
  )
}

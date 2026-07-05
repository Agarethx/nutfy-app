import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/shared/components/layout'
import { Typography, Button, Input } from '@/shared/components/ui'
import { supabase } from '@/shared/services/supabase'
import { mapAuthError } from '@/shared/utils/supabase-auth-error'
import { getErrorMessage } from '@/shared/utils/error-messages'
import { registerSchema, type RegisterFormValues } from '@/shared/validation/auth.schema'

export default function RegisterScreen() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setFormError(getErrorMessage(mapAuthError(error)))
      return
    }
    // Si el proyecto de Supabase tiene confirmación de correo activada
    // (en local está desactivada — config.toml [auth.email] enable_confirmations),
    // signUp no entrega sesión hasta que el usuario confirma. AuthProvider solo
    // redirige cuando hay sesión, así que mostramos este mensaje en vez de
    // navegar cuando data.session es null.
    if (!data.session) {
      setPendingConfirmation(true)
    }
    // Si hay sesión, AuthProvider la detecta y app/index.tsx redirige a (tabs).
  }

  if (pendingConfirmation) {
    return (
      <Screen className="items-center justify-center px-8">
        <Typography variant="h3" className="text-center">
          Revisa tu correo
        </Typography>
        <Typography variant="body" className="mt-2 text-center text-neutral-500">
          Te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta.
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
          <Typography variant="h2">Crear cuenta</Typography>
          <Typography variant="body" className="text-neutral-500">
            Empieza a planificar tu alimentación con IA
          </Typography>
        </View>

        <View className="gap-4">
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Contraseña"
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
          label="Crear cuenta"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="lg"
        />

        <View className="flex-row justify-center gap-1">
          <Typography variant="body" className="text-neutral-500">
            ¿Ya tienes cuenta?
          </Typography>
          <Typography
            variant="body"
            className="font-semibold text-primary-600"
            onPress={() => router.push('/(auth)/login')}
          >
            Inicia sesión
          </Typography>
        </View>
      </View>
    </Screen>
  )
}

import { forwardRef } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Typography } from './Typography'

type InputProps = TextInputProps & {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, className = '', ...props },
  ref,
) {
  return (
    <View className="w-full">
      {label && (
        <Typography variant="label" className="mb-1">
          {label}
        </Typography>
      )}
      <TextInput
        ref={ref}
        className={`
          h-11 w-full rounded-xl border px-4 text-base text-neutral-900
          ${error ? 'border-danger-500' : 'border-neutral-200'}
          ${className}
        `}
        placeholderTextColor="#a3a3a3"
        {...props}
      />
      {error && (
        <Typography variant="caption" className="mt-1 text-danger-600">
          {error}
        </Typography>
      )}
      {hint && !error && (
        <Typography variant="caption" className="mt-1">
          {hint}
        </Typography>
      )}
    </View>
  )
})

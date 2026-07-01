import { Component, type ReactNode, type ErrorInfo } from 'react'
import { View } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'
import { Button } from '@/shared/components/ui/Button'
import { logger } from '@/shared/utils/logger'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(error, { componentStack: info.componentStack })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Typography variant="h3" className="text-center">
            Algo salió mal
          </Typography>
          <Typography variant="body" className="text-center text-neutral-500">
            Ocurrió un error inesperado. Intenta de nuevo.
          </Typography>
          <Button
            label="Reintentar"
            onPress={this.handleReset}
            variant="secondary"
          />
        </View>
      )
    }

    return this.props.children
  }
}

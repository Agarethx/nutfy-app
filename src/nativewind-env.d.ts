/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ScrollViewProps,
  ScrollViewPropsAndroid,
  ScrollViewPropsIOS,
  Touchable,
  VirtualizedListProps,
} from 'react-native'

// NativeWind v4 type augmentation.
// Copied from react-native-css-interop/types to avoid nested node_modules
// resolution issues with `/// <reference types="nativewind/types" />`.

declare module 'react-native' {
  interface ViewProps {
    className?: string
    cssInterop?: boolean
  }
  interface TextProps {
    className?: string
    cssInterop?: boolean
  }
  interface ImagePropsBase {
    className?: string
    cssInterop?: boolean
  }
  interface ImageBackgroundProps extends ImagePropsBase {
    imageClassName?: string
  }
  interface TextInputProps {
    placeholderClassName?: string
  }
  interface ScrollViewProps
    extends ViewProps, ScrollViewPropsIOS, ScrollViewPropsAndroid, Touchable {
    contentContainerClassName?: string
    indicatorClassName?: string
  }
  interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
    columnWrapperClassName?: string
  }
  interface SwitchProps {
    className?: string
    cssInterop?: boolean
  }
  interface TouchableWithoutFeedbackProps {
    className?: string
    cssInterop?: boolean
  }
  interface KeyboardAvoidingViewProps extends ViewProps {
    contentContainerClassName?: string
  }
}

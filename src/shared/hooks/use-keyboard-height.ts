import { useState, useEffect } from 'react'
import { Keyboard, type KeyboardEvent } from 'react-native'

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) =>
      setHeight(e.endCoordinates.height),
    )
    const hide = Keyboard.addListener('keyboardWillHide', () => setHeight(0))

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return height
}

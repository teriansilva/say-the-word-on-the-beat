import { useCallback, useRef, useEffect } from 'react'

/**
 * Returns a debounced version of the callback that delays invoking
 * until after `delay` milliseconds have elapsed since the last call.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Update the callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  return debouncedCallback
}

/**
 * A hook that provides both immediate local state updates and debounced persistence.
 * This is useful for sliders where you want smooth UI updates but debounced API calls.
 * 
 * @param value The current persisted value
 * @param setValue The function to persist the value (will be debounced)
 * @param delay The debounce delay in milliseconds (default: 500ms)
 * @returns [localValue, setLocalValue] - use these for the slider
 */
export function useDebouncedSlider<T>(
  value: T,
  setValue: (value: T) => void,
  delay: number = 500
): [T, (value: T) => void] {
  const localValueRef = useRef<T>(value)
  const [localValue, setLocalValueState] = React.useState<T>(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local value when external value changes (e.g., from URL load)
  useEffect(() => {
    localValueRef.current = value
    setLocalValueState(value)
  }, [value])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const setLocalValue = useCallback(
    (newValue: T) => {
      // Update local state immediately for smooth UI
      localValueRef.current = newValue
      setLocalValueState(newValue)

      // Debounce the persistence
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setValue(newValue)
      }, delay)
    },
    [setValue, delay]
  )

  return [localValue, setLocalValue]
}

// Need React import for useState
import React from 'react'

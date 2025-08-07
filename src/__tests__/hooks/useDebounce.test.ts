/**
 * Tests for useDebounce hook
 */

import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  test('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Change the value
    rerender({ value: 'changed', delay: 500 })
    
    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Now the value should be updated
    expect(result.current).toBe('changed')
  })

  test('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change value multiple times quickly
    rerender({ value: 'change1', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(250)
    })
    
    rerender({ value: 'change2', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(250)
    })
    
    // Should still be initial value (timer reset)
    expect(result.current).toBe('initial')
    
    // Complete the debounce period
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(result.current).toBe('change2')
  })

  test('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    )

    rerender({ value: 'changed', delay: 1000 })
    
    // Should not update after 500ms
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')
    
    // Should update after full 1000ms
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('changed')
  })

  test('should work with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { name: 'test' }, delay: 500 } }
    )

    const newObject = { name: 'updated' }
    rerender({ value: newObject, delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(result.current).toEqual(newObject)
  })
})
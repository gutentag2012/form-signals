import { effect } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import {
  deepSignalifyValue,
  getSignalValueAtPath,
  removeSignalValueAtPath,
  setSignalValueAtPath,
  unSignalifyValue,
  unSignalifyValueSubscribed,
} from './signals.utils'

describe('signals.utils', () => {
  describe('deepSignalifyValue', () => {
    it.each([1, 'simple', null, undefined, new Date()])(
      'should signalify a simple value %j',
      (val) => {
        const signalified = deepSignalifyValue(val)
        expect(signalified.value).toBe(val)
      },
    )
    it('should signalify a simple object', () => {
      const signalified = deepSignalifyValue({ a: 1 })
      expect(signalified.value.a.value).toBe(1)
    })
    it('should signalify a simple array', () => {
      const signalified = deepSignalifyValue([1, 2])
      expect(signalified.value[0].key).not.toEqual(signalified.value[1].key)
      expect(signalified.value[0].signal.value).toBe(1)
      expect(signalified.value[1].signal.value).toBe(2)
    })
    it('should signalify a nested object', () => {
      const object = {
        deep: {
          nested: [[{ object: new Date() }]],
        },
      }
      const signalified = deepSignalifyValue(object)
      expect(
        signalified.value.deep.value.nested.value[0].signal.value[0].signal
          .value.object.value,
      ).toBe(object.deep.nested[0][0].object)
    })
  })
  describe('unSignalifyValue', () => {
    it('should unSignalify a simple value', () => {
      const signalified = deepSignalifyValue(1)
      expect(unSignalifyValue(signalified)).toBe(1)
    })
    it('should unSignalify a simple object', () => {
      const signalified = deepSignalifyValue({ a: 1 })
      expect(unSignalifyValue(signalified)).toEqual({ a: 1 })
    })
    it('should unSignalify a simple array', () => {
      const signalified = deepSignalifyValue([1, 2])
      expect(unSignalifyValue(signalified)).toEqual([1, 2])
    })
    it('should unSignalify a nested object', () => {
      const object = {
        deep: {
          nested: [[{ object: new Date() }]],
        },
      }
      const signalified = deepSignalifyValue(object)
      expect(unSignalifyValue(signalified)).toEqual(object)
    })
    it('should unSignalify without subscribing', () => {
      const signalified = deepSignalifyValue({ a: 1 })
      let called = false
      effect(() => {
        const unsignalified = unSignalifyValue(signalified)
        if (!called) {
          called = true
          return
        }
        throw new Error(`Should not be called with ${unsignalified}`)
      })

      expect(unSignalifyValue(signalified)).toEqual({ a: 1 })
      signalified.value.a.value = 2
      expect(unSignalifyValue(signalified)).toEqual({ a: 2 })
    })
    it('should unSignalify with subscribing', () => {
      const signalified = deepSignalifyValue({ a: 1 })
      const fn = vi.fn()
      effect(() => {
        const unsignalified = unSignalifyValueSubscribed(signalified)
        expect(unsignalified).toEqual({ a: expect.any(Number) })
        fn(unsignalified)
      })

      signalified.value.a.value = 2
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
  describe('getSignalValueAtPath', () => {
    it('should return undefined for an undefined path', () => {
      const val = deepSignalifyValue({})
      expect(getSignalValueAtPath(val, undefined as never)).toBe(undefined)
    })
    it('should return undefined for empty path', () => {
      const val = deepSignalifyValue({})
      expect(getSignalValueAtPath(val, '' as never)).toBe(undefined)
    })
    it('should return undefined for empty object', () => {
      const val = deepSignalifyValue(undefined)
      expect(getSignalValueAtPath(val, 'a' as never)).toBe(undefined)
    })
    it('should return undefined for non existing path', () => {
      const val = deepSignalifyValue({})
      expect(getSignalValueAtPath(val, 'a' as never)).toBe(undefined)
    })
    it('should return value for existing path', () => {
      const val = deepSignalifyValue({ a: 1 })
      expect(getSignalValueAtPath(val, 'a')).toEqual(val.value.a)
    })
    it('should return value for nested path', () => {
      const val = deepSignalifyValue({ a: { b: 1 } })
      expect(getSignalValueAtPath(val, 'a.b')).toEqual(val.value.a.value.b)
    })
    it('should return value for array path', () => {
      const val = deepSignalifyValue({ a: [1, 2] })
      expect(getSignalValueAtPath(val, 'a.0')).toEqual(
        val.value.a.value[0].signal,
      )
    })
  })
  describe('removeSignalValueAtPath', () => {
    it('should do nothing for an undefined object', () => {
      const obj = deepSignalifyValue(undefined)
      expect(removeSignalValueAtPath(obj, 'a' as never)).toBe(undefined)
    })
    it('should do nothing for an undefined path', () => {
      const obj = deepSignalifyValue({})
      expect(removeSignalValueAtPath(obj, undefined as never)).toEqual(
        undefined,
      )
    })
    it('should remove the value of an existing path', () => {
      const obj = deepSignalifyValue({ a: 1 })
      removeSignalValueAtPath(obj, 'a')
      expect(obj.value.a).toBe(undefined)
    })
    it('should remove the value of a nested path', () => {
      const obj = deepSignalifyValue({ a: { b: 1 } })
      removeSignalValueAtPath(obj, 'a.b')
      expect(obj.value.a.value.b).toBe(undefined)
    })
    it('should remove the value of an array path', () => {
      const obj = deepSignalifyValue({ a: [1, 2] })
      removeSignalValueAtPath(obj, 'a.0')
      expect(obj.value.a.value.length).toBe(1)
      expect(obj.value.a.value[0].signal.value).toBe(2)
    })
  })
  describe('setSignalValueAtPath', () => {
    it('should do nothing for an undefined signalified object', () => {
      const obj = deepSignalifyValue(undefined as unknown as { a: number })
      setSignalValueAtPath(obj as never, 'a' as never, 1 as never)
      expect(obj.value.a.value).toBe(1)
    })
    it('should do nothing for an undefined object', () => {
      const obj = undefined
      setSignalValueAtPath(obj as never, 'a' as never, 1 as never)
      expect(obj).toBe(undefined)
    })
    it('should do nothing for an undefined path', () => {
      const obj = deepSignalifyValue({})
      expect(setSignalValueAtPath(obj, undefined as never, 1 as never)).toEqual(
        undefined,
      )
      expect(obj.value).toEqual({})
    })
    it('should update the value of an existing path', () => {
      const obj = deepSignalifyValue({ a: 1 })
      setSignalValueAtPath(obj, 'a', 2)
      expect(obj.value.a.value).toBe(2)
    })
    it('should add the value of a non existing path', () => {
      const obj = deepSignalifyValue({} as { a: number })
      setSignalValueAtPath(obj, 'a', 1)
      expect(obj.value.a.value).toBe(1)
    })
    it('should add a value to an array path', () => {
      const obj = deepSignalifyValue({ a: [] } as { a: number[] })
      setSignalValueAtPath(obj, 'a.1', 1)
      expect(obj.value.a.value[0]).toEqual(undefined)
      expect(obj.value.a.value[1].signal.value).toEqual(1)
    })
    it('should add a deeply nested object path', () => {
      const obj = deepSignalifyValue({} as { a: { b: { c: number } } })
      setSignalValueAtPath(obj, 'a.b.c', 1)
      expect(obj.value.a.value.b.value.c.value).toBe(1)
    })
  })
})

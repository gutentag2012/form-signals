import { effect } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import {
  deepSignalifyValue,
  getSignalValueAtPath,
  removeSignalValueAtPath,
  setSignalValueAtPath,
  setSignalValuesFromObject,
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
      expect(signalified.value[0].data.value).toBe(1)
      expect(signalified.value[1].data.value).toBe(2)
    })
    it('should signalify a nested object', () => {
      const object = {
        deep: {
          nested: [[{ object: new Date() }]],
        },
      }
      const signalified = deepSignalifyValue(object)
      expect(
        signalified.value.deep.value.nested.value[0].data.value[0].data
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
      expect(getSignalValueAtPath(val, undefined as never)).toBe(val)
    })
    it('should return the object for empty path', () => {
      const val = deepSignalifyValue({})
      expect(getSignalValueAtPath(val, '' as never)).toBe(val)
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
        val.value.a.value[0].data,
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
      expect(obj.value.a.value[0].data.value).toBe(2)
    })
    it('should do nothing if the parent is undefined', () => {
      const obj = deepSignalifyValue({ a: { b: undefined } })
      removeSignalValueAtPath(obj, 'a.b.c.d' as never)
      expect(obj.value.a.value.b.value).toBe(undefined)
    })
  })
  describe('setSignalValuesFromObject', () => {
    it('should do nothing for an undefined object', () => {
      const obj = undefined
      expect(setSignalValuesFromObject(obj as never, { a: 1 }).value).toEqual(
        undefined,
      )
    })
    it('should do nothing for an undefined value', () => {
      const obj = deepSignalifyValue({ a: 1 })
      expect(setSignalValuesFromObject(obj, undefined)).toEqual(obj)
      expect(obj.value.a.value).toBe(1)
    })
    it('should update the value of an existing array', () => {
      const obj = deepSignalifyValue({ a: [1, 2] })
      setSignalValuesFromObject(obj, { a: [2, 3] })
      expect(obj.value.a.value[0].data.value).toBe(2)
      expect(obj.value.a.value[1].data.value).toBe(3)
    })
    it('should add the value of a non existing array', () => {
      const obj = deepSignalifyValue({} as { a: number[] })
      setSignalValuesFromObject(obj, { a: [1, 2] })
      expect(obj.value.a.value[0].data.value).toBe(1)
      expect(obj.value.a.value[1].data.value).toBe(2)
    })
    it('should add a value to an existing array', () => {
      const obj = deepSignalifyValue({ a: [1] })
      setSignalValuesFromObject(obj, { a: [1, 2] })
      expect(obj.value.a.value[0].data.value).toBe(1)
      expect(obj.value.a.value[1].data.value).toBe(2)
    })
    it('should remove a value from an existing array', () => {
      const obj = deepSignalifyValue({ a: [1, 2] })
      setSignalValuesFromObject(obj, { a: [1] })
      expect(obj.value.a.value[0].data.value).toBe(1)
      expect(obj.value.a.value[1]).toBe(undefined)
    })
    it('should add a deeply nested array', () => {
      const obj = deepSignalifyValue(
        {} as { a: Array<{ b: Array<{ c: number }> }> },
      )
      setSignalValuesFromObject(obj, { a: [{ b: [{ c: 1 }] }] })
      expect(
        obj.value.a.value[0].data.value.b.value[0].data.value.c.value,
      ).toBe(1)
    })
    it('should update the value of an existing object', () => {
      const obj = deepSignalifyValue({ a: 1 })
      setSignalValuesFromObject(obj, { a: 2 })
      expect(obj.value.a.value).toBe(2)
    })
    it('should add the value of a non existing object', () => {
      const obj = deepSignalifyValue({} as { a: number })
      setSignalValuesFromObject(obj, { a: 1 })
      expect(obj.value.a.value).toBe(1)
    })
    it('should remove the value of an existing object', () => {
      const obj = deepSignalifyValue<{ a: number; b?: number }>({ a: 1, b: 2 })
      setSignalValuesFromObject(obj, { a: 1 })
      expect(obj.value.b).toBe(undefined)
    })
    it('should add a deeply nested object', () => {
      const obj = deepSignalifyValue({} as { a: { b: { c: number } } })
      setSignalValuesFromObject(obj, { a: { b: { c: 1 } } })
      expect(obj.value.a.value.b.value.c.value).toBe(1)
    })
    it('should create an empty array if the parent value is not an array', () => {
      const obj = deepSignalifyValue<{ a: number[] }>({
        a: 1 as unknown as number[],
      })
      setSignalValuesFromObject(obj, { a: [1, 2] })
      expect(obj.value.a.value[0].data.value).toBe(1)
      expect(obj.value.a.value[1].data.value).toBe(2)
    })
    it('should create an empty object if the parent value is not an object', () => {
      const obj = deepSignalifyValue<{ a: { b: number } }>({
        a: 1 as unknown as { b: number },
      })
      setSignalValuesFromObject(obj, { a: { b: 1 } })
      expect(obj.value.a.value.b.value).toBe(1)
    })
    it('should be possible to do partial updates for arrays and ignore removed values', () => {
      const obj = deepSignalifyValue({ a: [1, 2, 3] })
      const change = [1, 4]
      setSignalValuesFromObject(obj, { a: change }, true)
      expect(obj.value.a.value[0].data.value).toEqual(1)
      expect(obj.value.a.value[1].data.value).toEqual(4)
      expect(obj.value.a.value[2].data.value).toEqual(3)
    })
    it('should remove values if no partial update was made on the array', () => {
      const obj = deepSignalifyValue({ a: [1, 2, 3] })
      const change = [1, 4]
      setSignalValuesFromObject(obj, { a: change }, false)
      expect(obj.value.a.value[0].data.value).toEqual(1)
      expect(obj.value.a.value[1].data.value).toEqual(4)
      expect(obj.value.a.value[2]).toBeUndefined()
    })
    it('should update the values reactively', () => {
      const obj = deepSignalifyValue<{
        name: string
        deep: { item: number; other?: string }
        array: Array<{ value: number }>
      }>({
        name: 'test',
        deep: {
          item: 1,
          other: 'test',
        },
        array: [
          {
            value: 1,
          },
          {
            value: 2,
          },
        ],
      })
      const fn = vi.fn()
      let ignoreEffect = 7
      effect(() => {
        const value = obj.peek().name.value
        if (ignoreEffect-- > 0) {
          return
        }
        fn(value)
      })
      effect(() => {
        const value = obj.peek().deep.peek().item.value
        if (ignoreEffect-- > 0) {
          return
        }
        fn(value)
      })
      effect(() => {
        const value = obj.peek().deep.peek().other?.value
        if (ignoreEffect-- > 0) {
          return
        }
        // This should not be called
        fn(value)
        throw new Error('Should not update the other value')
      })
      effect(() => {
        const value = obj.peek().array.peek()[0].data.value
        if (ignoreEffect-- > 0) {
          return
        }
        fn(value)
      })
      effect(() => {
        const value = obj.peek().array.peek()[1].data.value
        if (ignoreEffect-- > 0) {
          return
        }
        // This should not be called
        fn(value)
        throw new Error('Should not update the array value')
      })
      effect(() => {
        const value = obj.peek().array.value
        if (ignoreEffect-- > 0) {
          return
        }
        fn(value)
      })
      effect(() => {
        const value = obj.peek().deep.value
        if (ignoreEffect-- > 0) {
          return
        }
        fn(value)
      })
      expect(ignoreEffect).toBe(0)
      setSignalValuesFromObject(obj, {
        name: 'test1',
        deep: {
          item: 2,
        },
        array: [
          {
            value: 2,
          },
        ],
      })
      expect(fn).toHaveBeenCalledTimes(4)
      setSignalValuesFromObject(obj, {
        name: 'test1',
        deep: {
          item: 2,
          other: 'test',
        },
        array: [
          {
            value: 2,
          },
          {
            value: 2,
          },
        ],
      })
      expect(fn).toHaveBeenCalledTimes(6)
    })
    it('should make partial updates if configured', () => {
      const obj = deepSignalifyValue({
        first: 1,
        second: 2,
      })

      const fn = vi.fn()
      effect(() => {
        const value = obj.peek().first.value
        fn(value)
      })
      effect(() => {
        const value = obj.peek().second.value
        fn(value)
      })
      expect(fn).toHaveBeenCalledTimes(2)

      setSignalValuesFromObject(obj, { first: 2 }, true)
      expect(fn).toHaveBeenCalledTimes(3)
      expect(obj.value.first.value).toEqual(2)
      expect(obj.value.second.value).toEqual(2)

      setSignalValuesFromObject(obj, { first: 3 } as never)
      expect(fn).toHaveBeenCalledTimes(4)
      expect(obj.value.first.value).toEqual(3)
      expect(obj.value.second).toBeUndefined()
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
      expect(obj.value.a.value[1].data.value).toEqual(1)
    })
    it('should add a deeply nested object path', () => {
      const obj = deepSignalifyValue({} as { a: { b: { c: number } } })
      setSignalValueAtPath(obj, 'a.b.c', 1)
      expect(obj.value.a.value.b.value.c.value).toBe(1)
    })
    it('should create an empty array if the parent value is not an array', () => {
      const obj = deepSignalifyValue<{ a?: number[] }>({})
      setSignalValueAtPath(obj, 'a.1', 1)
      expect(obj.value.a?.value?.[0]).toBe(undefined)
      expect(obj.value.a?.value?.[1].data.value).toBe(1)
    })
  })
})

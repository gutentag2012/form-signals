import { describe, expect, it } from 'vitest'
import {
  deepCopy,
  getValueAtPath,
  pathToParts,
  removeValueAtPath,
  setValueAtPath,
} from './access.utils'

describe('access.utils', () => {
  describe('pathToParts', () => {
    it('should return an empty path for an empty string', () => {
      expect(pathToParts('')).toEqual([''])
    })
    it.each([
      ['a.b.c', ['a', 'b', 'c']],
      ['a', ['a']],
    ])(
      'should return an array for path elements separated with a dot %j should be %j',
      (path, expected) => {
        expect(pathToParts(path)).toEqual(expected)
      },
    )
    it('should parse array paths as numbers', () => {
      expect(pathToParts('a.0.b')).toEqual(['a', 0, 'b'])
    })
  })
  describe('getValueAtPath', () => {
    it('should return undefined for an undefined path', () => {
      expect(getValueAtPath({}, undefined as never)).toBe(undefined)
    })
    it('should return undefined for empty path', () => {
      expect(getValueAtPath({}, '' as never)).toBe(undefined)
    })
    it('should return undefined for empty object', () => {
      expect(getValueAtPath(undefined, 'a' as never)).toBe(undefined)
    })
    it('should return undefined for non existing path', () => {
      expect(getValueAtPath({}, 'a' as never)).toBe(undefined)
    })
    it('should return value for existing path', () => {
      expect(getValueAtPath({ a: 1 }, 'a')).toBe(1)
    })
    it('should return value for nested path', () => {
      expect(getValueAtPath({ a: { b: 1 } }, 'a.b')).toBe(1)
    })
    it('should return value for array path', () => {
      expect(getValueAtPath({ a: [1, 2] }, 'a.0')).toBe(1)
    })
  })
  describe('setValueAtPath', () => {
    it('should do nothing for an undefined object', () => {
      expect(setValueAtPath(undefined, 'a' as never, 1 as never)).toBe(
        undefined,
      )
    })
    it('should do nothing for an undefined path', () => {
      expect(setValueAtPath({}, undefined as never, 1 as never)).toEqual({})
    })
    it('should update the value of an existing path', () => {
      const obj = { a: 1 }
      expect(setValueAtPath(obj, 'a', 2)).toEqual(2)
      expect(obj).toEqual({ a: 2 })
    })
    it('should add the value of a non existing path', () => {
      const obj = {}
      expect(setValueAtPath(obj, 'a' as never, 1 as never)).toEqual(1)
      expect(obj).toEqual({ a: 1 })
    })
    it('should add a value to an array path', () => {
      const obj = { a: [] }
      expect(setValueAtPath(obj, 'a.1', 1 as never)).toEqual(1)
      expect(obj).toEqual({ a: [undefined, 1] })
    })
    it('should add a deeply nested object path', () => {
      const obj = {}
      expect(setValueAtPath(obj, 'a.b.c.0.1.d' as never, 1 as never)).toEqual(1)
      expect(obj).toEqual({ a: { b: { c: [[undefined, { d: 1 }]] } } })
    })
    it('should be able to set a value even if the parent is undefined', () => {
      const obj = { a: { b: undefined } }
      expect(setValueAtPath(obj, 'a.b.c' as never, 1 as never)).toEqual(1)
      expect(obj).toEqual({ a: { b: { c: 1 } } })
    })
  })
  describe('removeValueAtPath', () => {
    it('should do nothing for an undefined object', () => {
      expect(removeValueAtPath(undefined, 'a' as never)).toBe(undefined)
    })
    it('should do nothing for an undefined path', () => {
      expect(removeValueAtPath({}, undefined as never)).toEqual({})
    })
    it('should do nothing for an empty path', () => {
      expect(removeValueAtPath({}, '' as never)).toEqual({})
    })
    it('should do nothing for a non existing path', () => {
      expect(removeValueAtPath({}, 'a' as never)).toEqual({})
    })
    it('should remove the value of an existing path', () => {
      const obj = { a: 1 }
      expect(removeValueAtPath(obj, 'a')).toEqual({})
      expect(obj).toEqual({})
    })
    it('should remove the value of a nested path', () => {
      const obj = { a: { b: 1 } }
      expect(removeValueAtPath(obj, 'a.b')).toEqual({ a: {} })
      expect(obj).toEqual({ a: {} })
    })
    it('should remove the value of an array path', () => {
      const obj = { a: [1, 2] }
      expect(removeValueAtPath(obj, 'a.0')).toEqual({ a: [2] })
      expect(obj).toEqual({ a: [2] })
    })
    it('should do nothing if parent is undefined', () => {
      const obj = { a: { b: undefined } }
      expect(removeValueAtPath(obj, 'a.b.c' as never)).toEqual(obj)
      expect(obj).toEqual({ a: { b: undefined } })
    })
  })
  describe("deepCopy", () => {
    it("should return a new object", () => {
      const obj = { a: 1 }
      const copy = deepCopy(obj)
      expect(copy).toEqual(obj)
      expect(copy).not.toBe(obj)
    })
    it("should return a new object with nested objects", () => {
      const obj = { a: { b: 1 } }
      const copy = deepCopy(obj)
      expect(copy).toEqual(obj)
      expect(copy).not.toBe(obj)
      expect(copy.a).not.toBe(obj.a)
    })
    it("should return a new object with nested arrays", () => {
      const obj = { a: [1] }
      const copy = deepCopy(obj)
      expect(copy).toEqual(obj)
      expect(copy).not.toBe(obj)
      expect(copy.a).not.toBe(obj.a)
    })
    it("should return a new object with nested arrays and objects", () => {
      const obj = { a: [{ b: 1 }] }
      const copy = deepCopy(obj)
      expect(copy).toEqual(obj)
      expect(copy).not.toBe(obj)
      expect(copy.a).not.toBe(obj.a)
      expect(copy.a[0]).not.toBe(obj.a[0])
    })
  })
})

import type { Signal } from '@preact/signals-core'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { FormLogic } from './FormLogic'

describe('FormLogic (types)', () => {
  //region passing types
  it('should get the correct primitive type for strings', () => {
    const form = new FormLogic<{ name: string }>()

    assertType<string>(form.data.value.name.value)
  })
  it('should get the correct primitive type for numbers', () => {
    const form = new FormLogic<{ age: number }>()

    assertType<number>(form.data.value.age.value)
  })
  it('should get the correct primitive type for booleans', () => {
    const form = new FormLogic<{ isHuman: boolean }>()

    assertType<boolean>(form.data.value.isHuman.value)
  })
  it('should get the correct primitive type for dates', () => {
    const form = new FormLogic<{ birthday: Date }>()

    assertType<Date>(form.data.value.birthday.value)
  })
  it('should get the correct constant type for strings', () => {
    const form = new FormLogic<{ name: 'John' }>()

    assertType<'John'>(form.data.value.name.value)
  })
  //endregion
  //region inferring types
  it('should infer the primitive string type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { name: 'John' } })

    assertType<string>(form.data.value.name.value)
  })
  it('should infer the primitive number type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { age: 10 } })

    assertType<number>(form.data.value.age.value)
  })
  it('should infer the primitive boolean type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { isHuman: true } })

    assertType<boolean>(form.data.value.isHuman.value)
  })
  it('should infer the primitive date type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { birthday: new Date() } })

    assertType<Date>(form.data.value.birthday.value)
  })
  it('should infer the constant type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { name: 'John' as const } })

    assertType<'John'>(form.data.value.name.value)
  })
  //endregion
  //region array types
  it('should type the array items with keys and signals separately', () => {
    const form = new FormLogic<{ names: string[] }>()

    assertType<Array<{ key: number; data: Signal<string> }>>(
      form.data.value.names.value,
    )
  })
  it('should type the members of an array', () => {
    const form = new FormLogic<{ names: string[] }>()

    assertType<string>(form.data.value.names.value[0].data.value)
  })
  it('should infer the type of the array members from the default value', () => {
    const form = new FormLogic({ defaultValues: { names: ['John'] } })

    assertType<Array<{ key: number; data: Signal<string> }>>(
      form.data.value.names.value,
    )
  })
  it('should infer the type of all tuple members from the default value', () => {
    const form = new FormLogic({
      defaultValues: { names: ['John', 'Lee'] as const },
    })

    assertType<
      [
        { key: number; data: Signal<'John'> },
        { key: number; data: Signal<'Lee'> },
      ]
    >(form.data.value.names.value)
  })
  it('should not allow to push values into a tuple', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()

    expectTypeOf(form.pushValueToArray<'names'>)
      .parameter(1)
      .toBeNever()
  })
  it('should not allow to remove values from a tuple', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()

    expectTypeOf(form.removeValueFromArray<'names'>)
      .parameter(1)
      .toBeNever()
  })
  it('should only allow to insert the type of the tuple at a specific index', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()

    expectTypeOf(form.insertValueInArray<'names', 0>)
      .parameter(2)
      .toBeString()
    expectTypeOf(form.insertValueInArray<'names', 1>)
      .parameter(2)
      .toBeNumber()
  })
  it('should only allow to swap indexes in a tuple if the types are the same', () => {
    const form = new FormLogic<{ names: readonly [string, number, string] }>()

    // You cannot swap a string with a number
    expectTypeOf(form.swapValuesInArray<'names', 0, 1>)
      .parameter(1)
      .toBeNever()
    // You can swap two strings
    expectTypeOf(form.swapValuesInArray<'names', 0, 2>)
      .parameter(1)
      .toBeNumber()
  })
  //endregion
  //region nested types
  it('should type all nested fields as signals', () => {
    type Val = {
      nested: {
        deep: {
          num: number
        }
      }
    }
    const form = new FormLogic<Val>()

    assertType<
      Signal<{
        deep: Signal<{
          num: Signal<number>
        }>
      }>
    >(form.data.value.nested)
  })
  it('should deeply signalify array data based on the default value', () => {
    const form = new FormLogic({
      defaultValues: {
        dateRange: [new Date(), new Date()] as const,
        prices: {
          EUR: [
            { id: 'id1', value: 10, count: 1 },
            { id: 'id2', value: 20, count: 2 },
          ],
        },
      },
    })

    assertType<
      [{ key: number; data: Signal<Date> }, { key: number; data: Signal<Date> }]
    >(form.data.value.dateRange.value)
    assertType<{
      EUR: Signal<
        Array<{
          key: number
          data: Signal<{
            id: Signal<string>
            value: Signal<number>
            count: Signal<number>
          }>
        }>
      >
    }>(form.data.value.prices.value)
  })
  //endregion
  //region validator
  it('should infer the type of the value from the validator function', () => {
    new FormLogic<{ name: string }>({
      validator: (value) => {
        assertType<{ name: string }>(value)
        return undefined
      },
    })
  })
  it('should infer the type of the value from the async validator function', () => {
    new FormLogic<{ name: string }>({
      validatorAsync: async (value, abortSignal) => {
        assertType<{ name: string }>(value)
        assertType<AbortSignal>(abortSignal)
        return undefined
      },
    })
  })
  it('should infer the nested array type of the value form the validator', () => {
    new FormLogic<{ names: { lastNames: string[] } }>({
      validator: (value) => {
        assertType<{ names: { lastNames: string[] } }>(value)
        return undefined
      },
    })
  })
  //endregion
})

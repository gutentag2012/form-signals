import type { Signal } from '@preact/signals-core'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { FieldLogic } from './FieldLogic'
import { FormLogic } from './FormLogic'

describe('FieldLogic (types)', () => {
  //region passing types
  it('should get the correct primitive type for strings', () => {
    const form = new FormLogic<{ name: string }>()
    const field = new FieldLogic(form, 'name')

    assertType<string>(field.data.value)
  })
  it('should get the correct primitive type for numbers', () => {
    const form = new FormLogic<{ age: number }>()
    const field = new FieldLogic(form, 'age')

    assertType<number>(field.data.value)
  })
  it('should get the correct primitive type for booleans', () => {
    const form = new FormLogic<{ isHuman: boolean }>()
    const field = new FieldLogic(form, 'isHuman')

    assertType<boolean>(field.data.value)
  })
  it('should get the correct primitive type for dates', () => {
    const form = new FormLogic<{ birthday: Date }>()
    const field = new FieldLogic(form, 'birthday')

    assertType<Date>(field.data.value)
  })
  it('should get the correct constant type for strings', () => {
    const form = new FormLogic<{ name: 'John' | 'Lee' }>()
    const field = new FieldLogic(form, 'name')

    assertType<'John' | 'Lee'>(field.data.value)
  })
  //endregion
  //region inferring types
  it('should infer the primitive string type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { name: 'John' } })
    const field = new FieldLogic(form, 'name')

    assertType<string>(field.data.value)
  })
  it('should infer the primitive number type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { age: 25 } })
    const field = new FieldLogic(form, 'age')

    assertType<number>(field.data.value)
  })
  it('should infer the primitive boolean type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { isHuman: true } })
    const field = new FieldLogic(form, 'isHuman')

    assertType<boolean>(field.data.value)
  })
  it('should infer the primitive date type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { birthday: new Date() } })
    const field = new FieldLogic(form, 'birthday')

    assertType<Date>(field.data.value)
  })
  it('should infer the constant type of a field from the default value', () => {
    const form = new FormLogic({ defaultValues: { name: 'John' as const } })
    const field = new FieldLogic(form, 'name')

    assertType<'John'>(field.data.value)
  })
  //endregion
  //region array types
  it('should type the array items with keys and signals separately', () => {
    const form = new FormLogic<{ names: string[] }>()
    const field = new FieldLogic(form, 'names' as const)

    assertType<{ key: number; data: Signal<string> }[]>(field.data.value)
  })
  it('should type the members of an array', () => {
    const form = new FormLogic<{ names: string[] }>()
    const field = new FieldLogic(form, 'names.0' as const)

    assertType<string>(field.data.value)
  })
  it('should infer the type of the array members from the default value', () => {
    const form = new FormLogic({ defaultValues: { names: ['John'] } })
    const field = new FieldLogic(form, 'names' as const)

    assertType<Array<{ key: number; data: Signal<string> }>>(field.data.value)
  })
  it('should infer the type of all tuple members from the default value', () => {
    const form = new FormLogic({
      defaultValues: { names: ['John', 'Lee'] as const },
    })
    const field = new FieldLogic(form, 'names' as const)

    assertType<
      [
        { key: number; data: Signal<'John'> },
        { key: number; data: Signal<'Lee'> },
      ]
    >(field.data.value)
  })
  it('should type the members of a tuple in subfields', () => {
    const form = new FormLogic<{ names: [string, number] }>()
    const field1 = new FieldLogic(form, 'names.0' as const)
    const field2 = new FieldLogic(form, 'names.1' as const)

    assertType<string>(field1.data.value)
    assertType<number>(field2.data.value)
  })
  it('should not allow to push values into a tuple', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()
    const field = new FieldLogic(form, 'names' as const)

    expectTypeOf(field.pushValueToArray).parameter(0).toBeNever()
  })
  it('should not allow to push values into a tuple at an index', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()
    const field = new FieldLogic(form, 'names' as const)

    expectTypeOf(field.pushValueToArrayAtIndex).parameter(0).toBeNever()
    expectTypeOf(field.pushValueToArrayAtIndex).parameter(1).toBeNever()
  })
  it('should not allow to remove values from a tuple', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()
    const field = new FieldLogic(form, 'names' as const)

    expectTypeOf(field.removeValueFromArray).parameter(0).toBeNever()
  })
  it('should only allow to insert the type of the tuple at a specific index', () => {
    const form = new FormLogic<{ names: readonly [string, number] }>()
    const field = new FieldLogic(form, 'names' as const)

    expectTypeOf(field.insertValueInArray<0>)
      .parameter(1)
      .toBeString()
    expectTypeOf(field.insertValueInArray<1>)
      .parameter(1)
      .toBeNumber()
  })
  it('should only allow to swap indexes in a tuple if the types are the same', () => {
    const form = new FormLogic<{ names: readonly [string, number, string] }>()
    const field = new FieldLogic(form, 'names' as const)

    // You cannot swap a string with a number
    expectTypeOf(field.swapValuesInArray<0, 1>)
      .parameter(0)
      .toBeNever()
    // You can swap two strings
    expectTypeOf(field.swapValuesInArray<0, 2>)
      .parameter(0)
      .toBeNumber()
  })
  it('should only allow to swap self if parent is an array', () => {
    const form = new FormLogic<{ names: string }>()
    const field = new FieldLogic(form, 'names' as const)

    expectTypeOf(field.swapSelfInArray).parameter(0).toBeNever()
  })
  it('should only allow to swap self in tuple if target has the same type', () => {
    const form = new FormLogic<{ names: readonly [string, number, string] }>()
    const field = new FieldLogic(form, 'names.0' as const)

    // You cannot swap a string with a number
    expectTypeOf(field.swapSelfInArray<1>)
      .parameter(0)
      .toBeNever()
    // You can swap two strings
    expectTypeOf(field.swapSelfInArray<2>)
      .parameter(0)
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
    const field = new FieldLogic(form, 'nested' as const)

    assertType<
      Signal<{
        deep: Signal<{
          num: Signal<number>
        }>
      }>
    >(field.data)
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
    const fieldTuple = new FieldLogic(form, 'dateRange' as const)
    const fieldPrices = new FieldLogic(form, 'prices' as const)
    const fieldPricesEur = new FieldLogic(form, 'prices.EUR' as const)
    const fieldPricesEurEl = new FieldLogic(form, 'prices.EUR.0' as const)

    assertType<
      [{ key: number; data: Signal<Date> }, { key: number; data: Signal<Date> }]
    >(fieldTuple.data.value)
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
    }>(fieldPrices.data.value)
    assertType<
      Array<{
        key: number
        data: Signal<{
          id: Signal<string>
          value: Signal<number>
          count: Signal<number>
        }>
      }>
    >(fieldPricesEur.data.value)
    assertType<{
      id: Signal<string>
      value: Signal<number>
      count: Signal<number>
    }>(fieldPricesEurEl.data.value)
  })
  //endregion
  //region validator
  it('should infer the type of the value from the validator function', () => {
    const form = new FormLogic<{ name: string }>()
    new FieldLogic(form, 'name', {
      validator: (value) => {
        assertType<string>(value)
        return undefined
      },
    })
  })
  it('should infer the type of the value from the async validator function', () => {
    const form = new FormLogic<{ name: string }>()
    new FieldLogic(form, 'name', {
      validatorAsync: async (value, abortSignal) => {
        assertType<string>(value)
        assertType<AbortSignal>(abortSignal)
        return undefined
      },
    })
  })
  it('should infer the nested array type of the value form the validator', () => {
    const form = new FormLogic<{ names: { lastNames: string[] } }>()
    new FieldLogic(form, 'names.lastNames.0' as const, {
      validator: (value) => {
        assertType<string>(value)
        return undefined
      },
    })
    it('should use the unsignalified value for the validator', () => {
      const form = new FormLogic<{ name: { first: string; last: string } }>()
      new FieldLogic(form, 'name' as const, {
        validator: (value) => {
          assertType<{ first: string; last: string }>(value)
          return undefined
        },
      })
    })
  })
  //endregion
  //region transform
  it('should infer the type of the value from the configured transformer', () => {
    const form = new FormLogic<{ name: string }>()
    const field = new FieldLogic(form, 'name', {
      transformFromBinding: (value: number) => {
        assertType<number>(value)
        return value.toString()
      },
      transformToBinding: (value: string) => {
        assertType<string>(value)
        return Number.parseInt(value)
      },
    })

    assertType<string>(field.data.value)
    assertType<number>(field.transformedData.value)
    assertType<(newValue: number, options: never) => void>(
      field.handleChangeBound,
    )
  })
  it('should have never type for transformedData if no transformers are given', () => {
    const form = new FormLogic<{ name: string }>()
    const field = new FieldLogic(form, 'name')

    assertType<never>(field.transformedData.value)
  })
  // endregion
})

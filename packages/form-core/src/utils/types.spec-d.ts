import { describe, expectTypeOf, it } from 'vitest'
import type {
  ConnectPath,
  KeepOptionalKeys,
  LastPath,
  MakeOptionalIfNotExistInCheck,
  ParentPath,
  Paths,
  ValueAtPath,
  ValueAtPathForTuple,
} from './types'

describe('types', () => {
  //region Paths
  it('should not generate paths for primitives + dates', () => {
    expectTypeOf<Paths<string>>().toEqualTypeOf<''>()
    expectTypeOf<Paths<number>>().toEqualTypeOf<''>()
    expectTypeOf<Paths<boolean>>().toEqualTypeOf<''>()
    expectTypeOf<Paths<Date>>().toEqualTypeOf<''>()
    expectTypeOf<Paths<null>>().toEqualTypeOf<''>()
    expectTypeOf<Paths<undefined>>().toEqualTypeOf<''>()
  })
  it('should generate the first level of paths for objects', () => {
    expectTypeOf<Paths<{ name: string }>>().toEqualTypeOf<'' | 'name'>()
    expectTypeOf<Paths<{ age: number }>>().toEqualTypeOf<'' | 'age'>()
    expectTypeOf<Paths<{ isHuman: boolean }>>().toEqualTypeOf<'' | 'isHuman'>()
    expectTypeOf<Paths<{ birthday: Date }>>().toEqualTypeOf<'' | 'birthday'>()
  })
  it('should generate a deep path for nested objects', () => {
    expectTypeOf<Paths<{ person: { name: string } }>>().toEqualTypeOf<
      '' | 'person.name' | 'person'
    >()
    expectTypeOf<Paths<{ person: { age: number } }>>().toEqualTypeOf<
      '' | 'person.age' | 'person'
    >()
    expectTypeOf<Paths<{ person: { isHuman: boolean } }>>().toEqualTypeOf<
      '' | 'person.isHuman' | 'person'
    >()
    expectTypeOf<Paths<{ person: { birthday: Date } }>>().toEqualTypeOf<
      '' | 'person.birthday' | 'person'
    >()
    expectTypeOf<
      Paths<{ person: { deep: { object: { path: number } } } }>
    >().toEqualTypeOf<
      | ''
      | 'person'
      | 'person.deep'
      | 'person.deep.object'
      | 'person.deep.object.path'
    >()
  })
  it('should generate any number path for arrays', () => {
    expectTypeOf<
      Paths<{ obj: { array: Array<{ name: string }> } }>
    >().toEqualTypeOf<
      | ''
      | 'obj'
      | 'obj.array'
      | `obj.array.${number}`
      | `obj.array.${number}.name`
    >()
    expectTypeOf<Paths<string[]>>().toEqualTypeOf<'' | `${number}`>()
  })
  it('should generate all paths of a tuple', () => {
    expectTypeOf<Paths<{ tuple: [number, { name: string }] }>>().toEqualTypeOf<
      '' | 'tuple' | 'tuple.0' | 'tuple.1' | 'tuple.1.name'
    >()
    expectTypeOf<Paths<[string]>>().toEqualTypeOf<'' | '0'>()
  })
  it("should default to a string if it can't infer the type", () => {
    expectTypeOf<Paths>().toEqualTypeOf<string>()
  })
  //endregion
  //region ParentPath
  it('should get the parent path of a path', () => {
    expectTypeOf<ParentPath<'name'>>().toEqualTypeOf<''>()
    expectTypeOf<ParentPath<'person.name'>>().toEqualTypeOf<'person'>()
    expectTypeOf<
      ParentPath<'person.deep.object.path'>
    >().toEqualTypeOf<'person.deep.object'>()
    expectTypeOf<
      ParentPath<'person.deep.object.path.0'>
    >().toEqualTypeOf<'person.deep.object.path'>()
    expectTypeOf<
      ParentPath<'array.2.0.1.test'>
    >().toEqualTypeOf<'array.2.0.1'>()
  })
  //endregion
  //region LastPath
  it('should get the last path of a path', () => {
    expectTypeOf<LastPath<'name'>>().toEqualTypeOf<'name'>()
    expectTypeOf<LastPath<'person.name'>>().toEqualTypeOf<'name'>()
    expectTypeOf<LastPath<'person.deep.object.path'>>().toEqualTypeOf<'path'>()
    expectTypeOf<LastPath<'person.deep.object.path.0'>>().toEqualTypeOf<0>()
    expectTypeOf<LastPath<'array.2.0.1.test'>>().toEqualTypeOf<'test'>()
    expectTypeOf<LastPath<`array.${number}`>>().toEqualTypeOf<number>()
  })
  //endregion
  //region ConnectPath
  it('should combine two paths into one path', () => {
    expectTypeOf<ConnectPath<'person', 'name'>>().toEqualTypeOf<'person.name'>()
    expectTypeOf<
      ConnectPath<'person.deep.object', 'path'>
    >().toEqualTypeOf<'person.deep.object.path'>()
    expectTypeOf<ConnectPath<'array', '0'>>().toEqualTypeOf<'array.0'>()
    expectTypeOf<
      ConnectPath<'array.0', 'name'>
    >().toEqualTypeOf<'array.0.name'>()
  })
  it('should return the second path if the first path is empty', () => {
    expectTypeOf<ConnectPath<'', 'name'>>().toEqualTypeOf<'name'>()
    expectTypeOf<
      ConnectPath<'', 'person.name'>
    >().toEqualTypeOf<'person.name'>()
    expectTypeOf<
      ConnectPath<'', 'person.deep.object.path'>
    >().toEqualTypeOf<'person.deep.object.path'>()
    expectTypeOf<ConnectPath<'', 'array.0'>>().toEqualTypeOf<'array.0'>()
    expectTypeOf<
      ConnectPath<'', 'array.0.name'>
    >().toEqualTypeOf<'array.0.name'>()
  })
  //endregion
  //region KeepOptionalKeys
  it('should only return keys that are optional', () => {
    type Obj = { name: string; age?: number; another: string | undefined }
    expectTypeOf<KeepOptionalKeys<Obj, 'name'>>().toBeNever()
    expectTypeOf<KeepOptionalKeys<Obj, 'age'>>().toEqualTypeOf<'age'>()
    expectTypeOf<KeepOptionalKeys<Obj, 'another'>>().toBeNever()
  })
  it('should work for nested object', () => {
    type Obj = {
      person: { name: string; age?: number; another: string | undefined }
      optionalParent?: { requiredChild: boolean }
    }
    expectTypeOf<KeepOptionalKeys<Obj, 'person.name'>>().toBeNever()
    expectTypeOf<
      KeepOptionalKeys<Obj, 'person.age'>
    >().toEqualTypeOf<'person.age'>()
    expectTypeOf<KeepOptionalKeys<Obj, 'person.another'>>().toBeNever()
    expectTypeOf<
      KeepOptionalKeys<Obj, 'optionalParent'>
    >().toEqualTypeOf<'optionalParent'>()
    expectTypeOf<
      KeepOptionalKeys<Obj, 'optionalParent.requiredChild'>
    >().toBeNever()
  })
  //endregion
  //region ValueAtPath
  it('should infer the type of a value at a first level path', () => {
    const obj = { name: 'John' }
    type Obj = typeof obj
    expectTypeOf<ValueAtPath<Obj, 'name'>>().toEqualTypeOf<string>()
  })
  it('should infer const type of a value at a first level path', () => {
    const obj = { name: 'John' as const }
    type Obj = typeof obj
    expectTypeOf<ValueAtPath<Obj, 'name'>>().toEqualTypeOf<'John'>()
  })
  it('should get type of deep path', () => {
    const obj = { person: { deep: { object: { path: 1 } } } }
    type Obj = typeof obj
    expectTypeOf<ValueAtPath<Obj, 'person.deep'>>().toEqualTypeOf<{
      object: { path: number }
    }>()
    expectTypeOf<
      ValueAtPath<Obj, 'person.deep.object.path'>
    >().toEqualTypeOf<number>()
  })
  it('should get type of array', () => {
    const obj = { array: [{ name: 'John' }] }
    type Obj = typeof obj
    expectTypeOf<ValueAtPath<Obj, 'array.0'>>().toEqualTypeOf<{
      name: string
    }>()
    expectTypeOf<ValueAtPath<Obj, 'array.0.name'>>().toEqualTypeOf<string>()
  })
  it('should return any if the path is not included in the object', () => {
    const obj = { test: 1 }
    type Obj = typeof obj
    expectTypeOf<ValueAtPath<Obj, 'testt'>>().toEqualTypeOf<unknown>()
  })
  it('should return the base object, if an empty string is provided as the key', () => {
    const obj = { test: 1 }
    type Obj = typeof obj
    expectTypeOf<ValueAtPath<Obj, ''>>().toEqualTypeOf<Obj>()
  })
  it("should return the base type if an empty string is provided as the key and it's a primitive", () => {
    expectTypeOf<ValueAtPath<number, ''>>().toEqualTypeOf<number>()
    expectTypeOf<ValueAtPath<string, ''>>().toEqualTypeOf<string>()
    expectTypeOf<ValueAtPath<boolean, ''>>().toEqualTypeOf<boolean>()
    expectTypeOf<ValueAtPath<Date, ''>>().toEqualTypeOf<Date>()
  })
  //endregion
  it('should return an array of values for given paths', () => {
    type Obj = {
      name: string
      age: number
      nested: [{ name: string; age: number }]
    }
    expectTypeOf<
      ValueAtPathForTuple<Obj, ['name', 'age', 'nested.0.age']>
    >().toEqualTypeOf<[string, number, number]>()
  })
  it('should infer loosely if no const array was passed', () => {
    type Obj = { name: string; age: number }
    const paths = ['name' as const, 'age' as const]
    expectTypeOf<ValueAtPathForTuple<Obj, typeof paths>>().toEqualTypeOf<
      (string | number)[]
    >()
  })
  //region ValueAtPathForTuple
  //endregion
  //region MakeOptionalIfNotExistInCheck
  it('should keep base values if the exist in the check object', () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<string, string>
    >().toEqualTypeOf<string>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<number, number>
    >().toEqualTypeOf<number>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<boolean, boolean>
    >().toEqualTypeOf<boolean>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<Date, Date>
    >().toEqualTypeOf<Date>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<null, null>
    >().toEqualTypeOf<null>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<undefined, undefined>
    >().toEqualTypeOf<undefined>()
  })
  it("should make base values optional if they don't exist in the check object", () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<string, undefined>
    >().toEqualTypeOf<string | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<number, undefined>
    >().toEqualTypeOf<number | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<boolean, undefined>
    >().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<Date, undefined>
    >().toEqualTypeOf<Date | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<null, undefined>
    >().toEqualTypeOf<null | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<undefined, undefined>
    >().toEqualTypeOf<undefined>()
  })
  it('should keep tuple values if they exist in the check object', () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<[string], [string]>
    >().toEqualTypeOf<[string]>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<[string, number], [string, number]>
    >().toEqualTypeOf<[string, number]>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<
        [string, number, boolean],
        [string, number, boolean]
      >
    >().toEqualTypeOf<[string, number, boolean]>()
  })
  it("should make tuple values optional if they don't exist in the check object", () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<[string], undefined>
    >().toEqualTypeOf<[string] | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<[string, number], [undefined, number]>
    >().toEqualTypeOf<[string | undefined, number]>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<[string, number, boolean], [string, number]>
    >().toEqualTypeOf<[string, number, boolean | undefined]>()
  })
  it('should keep array values if they exist in the check object', () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<string[], string[]>
    >().toEqualTypeOf<string[]>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<number[], number[]>
    >().toEqualTypeOf<number[]>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<boolean[], boolean[]>
    >().toEqualTypeOf<boolean[]>()
    expectTypeOf<MakeOptionalIfNotExistInCheck<Date[], Date[]>>().toEqualTypeOf<
      Date[]
    >()
    expectTypeOf<MakeOptionalIfNotExistInCheck<null[], null[]>>().toEqualTypeOf<
      null[]
    >()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<undefined[], undefined[]>
    >().toEqualTypeOf<undefined[]>()
  })
  it("should make array values optional if they don't exist in the check object", () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<string[], undefined[]>
    >().toEqualTypeOf<Array<string | undefined>>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<number[], undefined>
    >().toEqualTypeOf<number[] | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<boolean[], undefined>
    >().toEqualTypeOf<boolean[] | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<Date[], undefined>
    >().toEqualTypeOf<Date[] | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<null[], undefined>
    >().toEqualTypeOf<null[] | undefined>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<undefined[], undefined>
    >().toEqualTypeOf<undefined[] | undefined>()
  })
  it("should make keys in an object optional if they don't exist in the check object", () => {
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<
        { name: string; age: number },
        { name: string }
      >
    >().toEqualTypeOf<{ name: string; age: number | undefined }>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<{ age: number }, { name: string }>
    >().toEqualTypeOf<{ age: number | undefined }>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<
        { isHuman: boolean },
        { name: string; isHuman: boolean }
      >
    >().toEqualTypeOf<{ isHuman: boolean }>()
    expectTypeOf<
      MakeOptionalIfNotExistInCheck<
        { birthday: Date },
        { name: string; isHuman: boolean }
      >
    >().toEqualTypeOf<{ birthday: Date | undefined }>()
  })
  //endregion
})

// TODO Try out how to apply this for the default and data in the form and fields
// const S = Symbol("test")
// class Test<TData=typeof S, TDefaultData=undefined> {
//   constructor(public readonly data: TDefaultData) {
//
//   }
//
//   get thing(): TData extends typeof S ? TDefaultData : MakeOptionalIfNotExistInCheck<TData, TDefaultData> {
//     return this.data as any
//   }
// }
//
// const creatorOf = <TData>() => {
//   return <TDefaultData>(data: TDefaultData) => {
//     return new Test<TData, TDefaultData>(data)
//   }
// }
// const newThing2 = creatorOf<{name: string, age: number}>()({name: "string"})
// newThing2.thing.name = undefined
// newThing2.thing.age = undefined
//
// const test1 = new Test({name: "string"})
// test1.thing.name = "undefined"
//
// const defaultValue = {name: "string"}
// const test2 = new Test<{name: string, age: number}, typeof defaultValue>(defaultValue)
// test2.thing.name = undefined
// test2.thing.age = undefined
//
// const test3 = new Test<{name: string, age: number}>(undefined)
// test3.thing.name = undefined
// test3.thing.age = undefined

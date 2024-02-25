import {describe, it, expectTypeOf} from "vitest";
import {Paths, ValueAtPath} from "./types";

describe("types", () => {
  //region Paths
  it("should not generate paths for primitives + dates", () => {
    expectTypeOf<Paths<string>>().toEqualTypeOf<never>();
    expectTypeOf<Paths<number>>().toEqualTypeOf<never>();
    expectTypeOf<Paths<boolean>>().toEqualTypeOf<never>();
    expectTypeOf<Paths<Date>>().toEqualTypeOf<never>();
    expectTypeOf<Paths<null>>().toEqualTypeOf<never>();
    expectTypeOf<Paths<undefined>>().toEqualTypeOf<never>();
  })
  it("should generate the first level of paths for objects", () => {
    expectTypeOf<Paths<{ name: string }>>().toEqualTypeOf<"name">();
    expectTypeOf<Paths<{ age: number }>>().toEqualTypeOf<"age">();
    expectTypeOf<Paths<{ isHuman: boolean }>>().toEqualTypeOf<"isHuman">();
    expectTypeOf<Paths<{ birthday: Date }>>().toEqualTypeOf<"birthday">();
  })
  it("should generate a deep path for nested objects", () => {
    expectTypeOf<Paths<{ person: { name: string } }>>().toEqualTypeOf<"person.name" | "person">();
    expectTypeOf<Paths<{ person: { age: number } }>>().toEqualTypeOf<"person.age" | "person">();
    expectTypeOf<Paths<{ person: { isHuman: boolean } }>>().toEqualTypeOf<"person.isHuman" | "person">();
    expectTypeOf<Paths<{ person: { birthday: Date } }>>().toEqualTypeOf<"person.birthday" | "person">();
    expectTypeOf<Paths<{ person: { deep: { object: { path: number } } } }>>().toEqualTypeOf<"person" | "person.deep" | "person.deep.object" | "person.deep.object.path">();
  })
  it("should generate any number path for arrays", () => {
    expectTypeOf<Paths<{obj: {array: Array<{name: string}>}}>>().toEqualTypeOf<"obj" | "obj.array" | `obj.array.${number}` | `obj.array.${number}.name`>();
  })
  it("should generate all paths of a tuple", () => {
    expectTypeOf<Paths<{tuple: [number, {name: string}]}>>().toEqualTypeOf<"tuple" | "tuple.0" | "tuple.1" | "tuple.1.name">();
  })
  //endregion
  //region ValueAtPath
  it("should infer the type of a value at a first level path", () => {
    const obj = { name: "John" };
    type Obj = typeof obj;
    expectTypeOf<ValueAtPath<Obj, "name">>().toEqualTypeOf<string>();
  })
  it("should infer const type of a value at a first level path", () => {
    const obj = { name: "John" as const };
    type Obj = typeof obj;
    expectTypeOf<ValueAtPath<Obj, "name">>().toEqualTypeOf<"John">();
  })
  it("should get type of deep path", () => {
    const obj = { person: { deep: {object: {path: 1}} } };
    type Obj = typeof obj;
    expectTypeOf<ValueAtPath<Obj, "person.deep">>().toEqualTypeOf<{object: {path: number}}>();
    expectTypeOf<ValueAtPath<Obj, "person.deep.object.path">>().toEqualTypeOf<number>();
  })
  it("should get type of array", () => {
    const obj = {array: [{name: "John"}]};
    type Obj = typeof obj;
    expectTypeOf<ValueAtPath<Obj, "array.0">>().toEqualTypeOf<{name: string}>();
    expectTypeOf<ValueAtPath<Obj, "array.0.name">>().toEqualTypeOf<string>();
  })
  //endregion
})

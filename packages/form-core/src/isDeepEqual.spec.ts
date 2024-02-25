import {it, describe, expect} from "vitest";
import {isDeepEqual} from "./isDeepEqual";

describe("isDeepEqual", () => {
  it.each([
    [1, 1],
    [null, null],
    [undefined, undefined],
    [new Date(0), new Date(0)],
    [{}, {}],
    [{a: 1}, {a: 1}],
    [{a: 1, b: {c: 2}}, {a: 1, b: {c: 2}}],
    [{nestedArray: [1, undefined, null, new Date()]}, {nestedArray: [1, undefined, null, new Date()]}],
  ])("should return true when a and b are equal for values %j and %j", (a, b) => {
    expect(isDeepEqual(a, b)).toBe(true);
  })
  it.each([
    [1, 2],
    [null, undefined],
    [undefined, null],
    [new Date(0), new Date(1)],
    [{}, {a: 1}],
    [{a: 1}, {a: 2}],
    [{a: 1, b: {c: 2}}, {a: 1, b: {c: 3}}],
    [{nestedArray: [1, undefined, null, new Date()]}, {nestedArray: [1, undefined, null, new Date(1)]}],
  ])("should return false when a and b are not equal for values %j and %j", (a, b) => {
    expect(isDeepEqual(a, b)).toBe(false);
  })
})

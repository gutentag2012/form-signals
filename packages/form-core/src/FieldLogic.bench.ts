import {describe, expect, vi, bench} from "vitest";
import {FormLogic} from "./FormLogic";
import {effect} from "@preact/signals-core";

describe('FieldLogic (bench)', () => {
  bench('Update a value', () => {
    const form = new FormLogic({
      defaultValues: {
        counter: 0,
      },
    })
    form.mount()

    const fn = vi.fn()
    effect(() => {
      fn(form.data.peek().counter.value)
    })

    for (let i = 0; i < 1_000; i++) {
      form.data.peek().counter.value = i
    }
    expect(fn).toHaveBeenCalledTimes(1_000)
  });
});

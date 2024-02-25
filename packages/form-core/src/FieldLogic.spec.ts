import { describe, expect, it, vi } from "vitest";
import { FormLogic } from "./FormLogic";
import { FieldLogic } from "./FieldLogic";
import {effect} from "@preact/signals";

describe("FieldLogic", () => {
  describe("construction", () => {
    it("should use the given default values", () => {
      const form = new FormLogic<{ name: string }>({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name", {
        defaultValue: "default",
      });
      field.mount()

      expect(field.signal?.value).toBe("default");
    });
    it("should deeply signalify the default value", () => {
      const form = new FormLogic({
        defaultValues: {
          name: {
            deepArray: [
              undefined,
              {
                nested: [["string"]],
              },
            ],
          },
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name.deepArray.1.nested.0.0", {
        defaultValue: "default",
      });
      field.mount()

      expect(field.signal?.value).toBe("default");
    });
    it("should fall back on the form default values", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.signal?.value).toBe("test");
    });
    it("should have default state in beginning (not dirty, not validating, no errors, not touched, isValid)", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.signal.value).toBeUndefined();
      expect(field.isDirty.value).toBe(false);
      expect(field.isValidating.value).toBe(false);
      expect(field.errors.value).toEqual([]);
      expect(field.isTouched.value).toBe(false);
      expect(field.isValid.value).toBe(true);
    });
    it("should be able to set default state of isTouched to true", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        defaultState: {
          isTouched: true,
        },
      });
      field.mount()

      expect(field.isTouched.value).toBe(true);
    });
    it("should be able to set default errors", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        defaultState: {
          errors: {
            onChange: "error",
          },
        },
      });
      field.mount()

      expect(field.errors.value).toEqual(["error"]);
    })
  });
  describe("value", () => {
    it("should return the value from the form", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()
      form.data.value.name.value = "new value";

      expect(field.signal.value).toBe("new value");
    });
    it("should return the value as a reactive signal", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      const spy = vi.fn();
      effect(() => {
        spy(field.signal.value);
      });
      form.data.value.name.value = "new value";

      expect(spy).toBeCalledWith("new value");
    });
    it("should set the value in the form", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      field.handleChange("new value");

      expect(form.data.value.name.value).toBe("new value");
    });
    it("should reactively insert a value into the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, undefined, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()
      field.insertValueInArray(1, 2);

      expect(field.signal.value[1].signal.value).toBe(2);
    });
    it("should reactively push a value to the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, undefined, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()
      field.pushValueToArray(4);

      expect(field.signal.value[3].signal.value).toBe(4);
    });
    it("should reactively remove a value from the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.signal.value.length).toBe(3);
      field.removeValueFromArray(1);

      expect(field.signal.value.length).toBe(2);
    });
    it("should reactively update a value in the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      const spy = vi.fn();
      effect(() => {
        spy(field.signal.value);
      });
      field.pushValueToArray(4);

      // We are checking the second call, since the effect will be called once with the current value
      const call = spy.mock.calls[1];
      expect(call[0].length).toBe(4);
    });
    it("should reactively swap two values in the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()
      field.swapValuesInArray(0, 2);

      expect(field.signal.value[0].signal.value).toBe(3);
      expect(field.signal.value[2].signal.value).toBe(1);
    })
    it("should do nothing when trying to insert a value into a non-array field", () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      });
      form.mount()

      const field = new FieldLogic(form, "someVal");
      field.mount()

      expect(field.signal.value).toBe(1);
      field.insertValueInArray(1, 2 as never);

      expect(field.signal.value).toBe(1);
    });
    it("should do nothing when trying to push a value into a non-array field", () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      });
      form.mount()

      const field = new FieldLogic(form, "someVal");
      field.mount()

      expect(field.signal.value).toBe(1);
      field.pushValueToArray(1 as never);

      expect(field.signal.value).toBe(1);
    });
    it("should do nothing when trying to remove a value from a non-array field", () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      });
      form.mount()

      const field = new FieldLogic(form, "someVal");
      field.mount()

      expect(field.signal.value).toBe(1);
      field.removeValueFromArray(1 as never);

      expect(field.signal.value).toBe(1);
    });
    it("should do nothing when trying to swap values in a non-array field", () => {
      const form = new FormLogic({
        defaultValues: {
          someVal: 1,
        },
      });
      form.mount()

      const field = new FieldLogic(form, "someVal");
      field.mount()

      expect(field.signal.value).toBe(1);
      field.swapValuesInArray(1 as never, 2 as never);

      expect(field.signal.value).toBe(1);
    })
  });
  describe("validation", () => {
    it("should validate without errors if the value is correct", async () => {
      const form = new FormLogic<{name: string}>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error"
          }]
      });
      field.mount()

      field.handleChange("test");
      await field.validateForEvent("onSubmit")

      expect(field.errors.value).toEqual([]);
    });
    it("should validate with errors if the value is incorrect", async () => {
      const form = new FormLogic<{name: string}>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error"
          }
        ]
      });
      field.mount()

      field.handleChange("test1");
      await field.validateForEvent("onSubmit")

      expect(field.errors.value).toEqual(["error"]);
    })
    it("should work with async validators", async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async () => {
              await new Promise(resolve => setTimeout(resolve, 100));
              return "error";
            },
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const validationPromise = field.validateForEvent("onSubmit");
      expect(field.errors.value).toEqual([]);
      expect(field.isValidating.value).toBe(true);

      await vi.advanceTimersToNextTimerAsync();
      await validationPromise;

      expect(field.errors.value).toEqual(["error"]);
      expect(field.isValidating.value).toBe(false);

      vi.useRealTimers()
    });
    it("should debounce the validation", async () => {
      vi.useFakeTimers()

      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async value => {
              validateFn(value)
              await new Promise(resolve => setTimeout(resolve, 100));
              return value === "test" ? undefined : "error";
            },
            onChange: true,
            onSubmit: false,
            debounceMs: 100,
          },
        ],
      });
      field.mount()

      field.signal.value = "value"
      await vi.advanceTimersByTime(50);
      field.signal.value = "value2"
      await vi.advanceTimersByTime(200);

      expect(field.errors.value).toEqual([]);
      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    });
    it("should validate after change", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onChange: true,
            onBlur: false,
            onSubmit: false,
            onMount: false,
          }
        ]
      });
      field.mount()

      field.signal.value = "test1"

      expect(field.errors.value).toEqual(["error"]);
    });
    it("should validate after blur", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onBlur: true,
            onChange: false,
            onSubmit: false,
            onMount: false,
          }
        ]
      });
      field.mount()

      field.handleBlur()

      expect(field.errors.value).toEqual(["error"]);
    });
    it("should validate after mount", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onMount: true,
            onChange: false,
            onSubmit: false,
            onBlur: false,
          }
        ]
      });
      field.mount()

      expect(field.errors.value).toEqual(["error"]);
    });
    it("should validate after submit of the form", async () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onChange: false,
            onSubmit: true,
            onBlur: false,
            onMount: false,
          }
        ]
      });
      field.mount()
      await field.mount()

      await form.handleSubmit()

      expect(field.errors.value).toEqual(["error"]);
    });
    it("should reset onSubmit errors after any change", ( )=> {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error"
          }
        ]
      });
      field.mount()

      field.signal.value = "test"
      field.handleSubmit()
      expect(field.errors.peek()).toEqual([]);

      field.signal.value = "asd"
      field.handleSubmit()
      expect(field.errors.peek()).toEqual(["error"]);

      field.signal.value = "asdd"
      expect(field.errors.peek()).toEqual([]);
    })
    it("should only accept the first validator if there are multiple sync validators for the same event", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const validateFn = vi.fn(() => "error")
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: validateFn,
            onChange: true,
          },
          {
            validate: validateFn,
            onChange: true,
          }
        ]
      });
      field.mount()

      field.handleChange("test1")

      expect(validateFn).toHaveBeenCalledOnce()
      expect(field.errors.value).toEqual(["error"]);
    })
    it("should reset the change errors after change", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onBlur: false,
            onSubmit: false,
            onMount: false,
            onChange: true,
          }
        ]
      });
      field.mount()

      field.signal.value = "test1"

      expect(field.errors.value).toEqual(["error"]);
      field.handleChange("test")
      expect(field.errors.value).toEqual([]);
    });
    it("should reset the blur errors after blur", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onChange: false,
            onSubmit: false,
            onMount: false,
            onBlur: true,
          }
        ]
      });
      field.mount()
      field.handleBlur()

      expect(field.errors.value).toEqual(["error"]);
      field.handleChange("test")
      field.handleBlur()

      expect(field.errors.value).toEqual([]);
    });
    it("should not reset the blur errors if no new blur occurred", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate: value => value === "test" ? undefined : "error",
            onBlur: true,
          }
        ]
      });
      field.mount()
      field.handleBlur()

      expect(field.errors.value).toEqual(["error"]);
      field.handleChange("test")

      expect(field.errors.value).toEqual(["error"]);
    });
    it("should abort async validations if there was another validation before the promise resolved", async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async (value, abortSignal) => {
              await new Promise(resolve => setTimeout(resolve, 100));
              if (abortSignal.aborted) return "aborted";
              validateFn(value)
              return value === "test" ? undefined : "error";
            },
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const firstSubmitPromise = field.handleSubmit()
      vi.advanceTimersByTime(50)
      const secondSubmitPromise = field.handleSubmit()
      vi.advanceTimersByTime(100)

      await Promise.all([firstSubmitPromise, secondSubmitPromise])

      expect(validateFn).toHaveBeenCalledOnce()

      vi.useRealTimers()
    });
    it("should abort other async validations if one validation failed unless configured otherwise", async () => {
      vi.useFakeTimers()
      const validateCalledFn = vi.fn()
      const validateRanFn = vi.fn()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise(resolve => setTimeout(resolve, 100));
              if (abortSignal.aborted) return "aborted";
              validateRanFn()
              return "error";
            },
          },
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise(resolve => setTimeout(resolve, 200));
              if (abortSignal.aborted) return "aborted";
              validateRanFn()
              return "error";
            },
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const promise = field.handleSubmit()
      await vi.advanceTimersToNextTimerAsync()
      await vi.advanceTimersToNextTimerAsync()
      await promise


      expect(validateCalledFn).toHaveBeenCalledTimes(2)
      expect(validateRanFn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
    it("should abort other debounced async validations if one validation failed unless configured otherwise", async () => {
      vi.useFakeTimers()
      const validateCalledFn = vi.fn()
      const validateRanFn = vi.fn()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise(resolve => setTimeout(resolve, 150));
              if (abortSignal.aborted) return "aborted";
              validateRanFn()
              return "error";
            },
            debounceMs: 100
          },
          {
            isAsync: true,
            validate: async (_, abortSignal) => {
              validateCalledFn()
              await new Promise(resolve => setTimeout(resolve, 100));
              if (abortSignal.aborted) return "aborted";
              validateRanFn()
              return "error";
            },
            debounceMs: 50
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const promise = field.handleSubmit()
      // Debounced first
      await vi.advanceTimersByTimeAsync(50)
      // Debounced second + finished first
      await vi.advanceTimersByTimeAsync(100)
      // Finished second
      await vi.advanceTimersByTimeAsync(150)
      await promise


      expect(validateCalledFn).toHaveBeenCalledTimes(2)
      expect(validateRanFn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
    it("should not run async validations if the sync validation already failed unless configured otherwise", async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async value => {
              validateFn(value)
              await new Promise(resolve => setTimeout(resolve, 100));
              return value === "test" ? undefined : "error";
            },
          },
          {
            validate: value => value === "test" ? undefined : "error",
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const promise = field.handleSubmit()
      await vi.advanceTimersByTime(100)
      await promise

      expect(validateFn).toBeCalledTimes(0)

      vi.useRealTimers()
    })
    it("should accumulate other async validations if configured", async () => {
      vi.useFakeTimers()
      const validateFn = vi.fn()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        accumulateErrors: true,
        validators: [
          {
            isAsync: true,
            validate: async value => {
              validateFn(value)
              await new Promise(resolve => setTimeout(resolve, 100));
              return value === "test" ? undefined : "error";
            },
          },
          {
            validate: value => value === "test" ? undefined : "error",
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const promise = field.handleSubmit()
      await vi.advanceTimersByTime(100)
      await promise

      expect(validateFn).toBeCalledTimes(1)

      vi.useRealTimers()
    })
    it("should allow a validator to run on every event", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const validate = vi.fn(() => undefined)
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate,
            onBlur: true,
            onChange: true,
            onSubmit: true,
            onMount: true,
          }
        ]
      });
      field.mount()

      field.handleBlur()
      field.handleChange("test")
      form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(4)
    })
    it("should not validate if unmounted", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const validate = vi.fn(() => undefined)
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            validate,
            onBlur: true,
            onChange: true,
            onSubmit: true,
            onMount: true,
          }
        ]
      });

      field.handleBlur()
      field.handleChange("test")
      form.handleSubmit()

      expect(validate).toHaveBeenCalledTimes(0)
    })
  });
  describe("state", () => {
    it("should not be mounted after construction", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name");

      expect(field.isMounted).toBe(false);
    })
    it("should be mounted after mount", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.isMounted).toBe(true);
    })
    it("should be dirty if the value has changed", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.isDirty.value).toBe(false);
      field.handleChange("new value");

      expect(field.isDirty.value).toBe(true);
    });
    it("should be dirty if an item was inserted into the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isDirty.value).toBe(false);
      field.pushValueToArray(4);

      expect(field.isDirty.value).toBe(true);
    })
    it("should not be dirty if the default value is set", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.isDirty.value).toBe(false);
      field.handleChange("test1");

      expect(field.isDirty.value).toBe(true);
      field.handleChange("test");

      expect(field.isDirty.value).toBe(false);
    })
    it("should not be dirty if the values of the array are same as the default values", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isDirty.value).toBe(false);
      field.pushValueToArray(1)

      expect(field.isDirty.value).toBe(true);
      field.removeValueFromArray(3)


      expect(field.isDirty.value).toBe(false);
    })
    it("should be touched after it was blurred", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.handleBlur();

      expect(field.isTouched.value).toBe(true);
    });
    it("should not be touched after its value was changed", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.handleChange("new value");

      expect(field.isTouched.value).toBe(false);
    });
    it("should be touched after its value was changed if configured", () => {
      const form = new FormLogic({
        defaultValues: {
          name: "test",
        },
      });
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.handleChange("new value", {shouldTouch: true});

      expect(field.isTouched.value).toBe(true);
    })
    it("should not be touched after a value was pushed to the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.pushValueToArray(4);

      expect(field.isTouched.value).toBe(false);
    })
    it("should be touched after a value was pushed to the array if configured", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.pushValueToArray(4, {shouldTouch: true});

      expect(field.isTouched.value).toBe(true);
    })
    it("should not be touched after a value was inserted into the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.insertValueInArray(1, 2);

      expect(field.isTouched.value).toBe(false);
    })
    it("should be touched after a value was inserted into the array if configured", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.insertValueInArray(1, 2, {shouldTouch: true});

      expect(field.isTouched.value).toBe(true);
    })
    it("should not be touched after a value was removed from the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.removeValueFromArray(1);

      expect(field.isTouched.value).toBe(false);
    })
    it("should be touched after a value was removed from the array if configured", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.removeValueFromArray(1, {shouldTouch: true});

      expect(field.isTouched.value).toBe(true);
    })
    it("should not be touched after a value was swapped in the array", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.swapValuesInArray(0, 2);

      expect(field.isTouched.value).toBe(false);
    })
    it("should be touched after a value was swapped in the array if configured", () => {
      const form = new FormLogic({
        defaultValues: {
          array: [1, 2, 3],
        },
      });
      form.mount()

      const field = new FieldLogic(form, "array" as const);
      field.mount()

      expect(field.isTouched.value).toBe(false);
      field.swapValuesInArray(0, 2, {shouldTouch: true});

      expect(field.isTouched.value).toBe(true);
    })
    it("should preserve field state on unmount if configured", () => {
      const form = new FormLogic<{name: string}>();
      form.mount()

      const field = new FieldLogic(form, "name");
      field.mount()
      field.handleBlur()
      field.signal.value = "value"

      expect(field.isTouched.value).toBe(true);
      expect(form.data.value.name.value).toBe("value");
      field.unmount();

      expect(form.data.value.name).toBeUndefined();
      expect(field.isTouched.value).toBe(false);
    });
    it("should reset field state on unmount if not otherwise configured", () => {
      const form = new FormLogic<{name: string}>();
      form.mount()

      const field = new FieldLogic(form, "name", {
        preserveValueOnUnmount: true
      });
      field.mount()
      field.handleBlur()
      field.handleChange("value")

      expect(field.isTouched.value).toBe(true);
      expect(form.data.value.name.value).toBe("value");
      field.unmount();

      expect(form.data.value.name.value).toBe("value");
      expect(field.isTouched.value).toBe(false);

    });
    it("should show the validating state while doing async validation", async () => {
      vi.useFakeTimers()
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name", {
        validators: [
          {
            isAsync: true,
            validate: async value => {
              await new Promise(resolve => setTimeout(resolve, 100));
              return value === "test" ? undefined : "error";
            },
          },
        ],
      });
      field.mount()

      field.handleChange("test1");
      const validationPromise = field.validateForEvent("onSubmit");
      await vi.advanceTimersByTime(100);

      expect(field.isValidating.value).toBe(true);
      await validationPromise;

      expect(field.isValidating.value).toBe(false);

      vi.useRealTimers()
    });
    it("should not accept value changes through its handlers", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name");
      field.mount()
      field.unmount()

      expect(field.signal.value).toBeUndefined();
      field.handleChange("test1");
      expect(field.signal.value).toBeUndefined();
    })
    it("should accept value directly through the signal", () => {
      const form = new FormLogic<{ name: string }>();
      form.mount()
      const field = new FieldLogic(form, "name");
      field.mount()
      field.unmount()

      expect(field.signal.value).toBeUndefined();
      field.signal.value = "test";
      expect(field.signal.value).toBe("test");
    })
  });
});

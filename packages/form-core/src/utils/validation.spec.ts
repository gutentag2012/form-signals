import {beforeEach, describe, expect, it, vi} from "vitest";
import {
  groupValidators,
  resetValidatorKeys,
  validateWithValidators,
  ValidationError,
  Validator,
  ValidatorEvents
} from "./validation";
import {signal} from "@preact/signals";

describe("validation", () => {
  beforeEach(resetValidatorKeys)

	describe("groupValidators", () => {
		it("should return empty arrays for each validation event when no validators are given", () => {
			const groupedValidators = groupValidators();
			expect(groupedValidators).toEqual({
				onChange: { sync: [], async: [] },
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			});
		});
		it("should group validators by their events and whether they are async or not", () => {
			const validate = () => undefined;
			const validateAsync = () => Promise.resolve(undefined);

			const validatorSync = {
				validate,
				onChange: true,
				onSubmit: true,
				onBlur: true,
				onMount: true,
			};
			const validatorAsync = {
				validate: validateAsync,
				isAsync: true as const,
				onChange: true,
				onSubmit: true,
				onBlur: true,
				onMount: true,
			};

			const validators: Array<Validator<unknown>> = [
				validatorSync,
				validatorAsync,
			];
			const groupedValidators = groupValidators(validators);
			expect(groupedValidators).toEqual({
				onChange: {
					sync: [{ ...validatorSync, key: expect.any(Number) }],
					async: [{ ...validatorAsync, key: expect.any(Number) }],
				},
				onBlur: {
					sync: [{ ...validatorSync, key: expect.any(Number) }],
					async: [{ ...validatorAsync, key: expect.any(Number) }],
				},
				onSubmit: {
					sync: [{ ...validatorSync, key: expect.any(Number) }],
					async: [{ ...validatorAsync, key: expect.any(Number) }],
				},
				onMount: {
					sync: [{ ...validatorSync, key: expect.any(Number) }],
					async: [{ ...validatorAsync, key: expect.any(Number) }],
				},
			});
		});
		it("should use use the same validator and key for all events specified", () => {
			const validate = () => undefined;
			const validatorSync = { validate, onChange: true, onSubmit: true };
			const validatorSync2 = { validate, onBlur: true, onMount: true };

			const validators: Array<Validator<unknown>> = [
				validatorSync,
				validatorSync2,
			];
			const groupedValidators = groupValidators(validators);
			expect(groupedValidators).toEqual({
				onChange: { sync: [{ ...validatorSync, key: 0 }], async: [] },
				onBlur: { sync: [{ ...validatorSync2, key: 1 }], async: [] },
				onSubmit: {
					sync: [
						{ ...validatorSync, key: 0 },
						{ ...validatorSync2, key: 1 },
					],
					async: [],
				},
				onMount: { sync: [{ ...validatorSync2, key: 1 }], async: [] },
			});
		});
	});
	describe("validateWithValidators", () => {
		it("should not do anything when no validators are given", async () => {
			const value = "test";
			const event = "onChange" as ValidatorEvents;
			const validators = {
				onChange: { sync: [], async: [] },
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			};
			const asyncValidatorState = {};
			const errorMap = signal<
				Partial<Record<ValidatorEvents, ValidationError>>
			>({});
			const isValidating = signal(false);
			const accumulateErrors = false;

			await validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			expect(errorMap.value).toEqual({});
		});
		it("should keep existing errors when no validators are given", async () => {
			const value = "test";
			const event = "onChange" as ValidatorEvents;
			const validators = {
				onChange: { sync: [], async: [] },
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			};
			const asyncValidatorState = {};
			const errorMap = signal<
				Partial<Record<ValidatorEvents, ValidationError>>
			>({
				onChange: "error",
			});
			const isValidating = signal(false);
			const accumulateErrors = false;

			await validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			expect(errorMap.value).toEqual({ onChange: "error" });
		});
		it("should validate all sync validators for the given event", async () => {
			const value = "test";
			const event = "onChange" as ValidatorEvents;
			const validate = vi.fn(() => undefined);
			const validate2 = vi.fn(() => "error");
			const validators = {
				onChange: {
					sync: [
						{ validate, onChange: true, key: 0 },
						{ validate: validate2, onChange: true, key: 1 },
					],
					async: [],
				},
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			};
			const asyncValidatorState = {};
			const errorMap = signal<
				Partial<Record<ValidatorEvents, ValidationError>>
			>({});
			const isValidating = signal(false);
			const accumulateErrors = false;

			await validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			expect(validate).toHaveBeenCalledWith(value);
			expect(validate2).toHaveBeenCalledWith(value);
			expect(errorMap.value).toEqual({ onChange: "error" });
		});
		it("should stop validation on the first error when accumulateErrors is false", async () => {
			const value = "test";
			const event = "onChange" as ValidatorEvents;
			const validate = vi.fn(() => "error");
			const validate2 = vi.fn(() => "error");
			const validators = {
				onChange: {
					sync: [
						{ validate, onChange: true, key: 0 },
						{ validate: validate2, onChange: true, key: 1 },
					],
					async: [],
				},
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			};
			const asyncValidatorState = {};
			const errorMap = signal<
				Partial<Record<ValidatorEvents, ValidationError>>
			>({});
			const isValidating = signal(false);
			const accumulateErrors = false;

			await validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			expect(validate).toHaveBeenCalledWith(value);
			expect(validate2).not.toHaveBeenCalled();
			expect(errorMap.value).toEqual({ onChange: "error" });
		});
		it("should accumulate validation errors when accumulateErrors is true", async () => {
			const value = "test";
			const event = "onChange" as ValidatorEvents;
			const validate = vi.fn(() => "error");
			const validate2 = vi.fn(() => "error");
			const validators = {
				onChange: {
					sync: [
						{ validate, onChange: true, key: 0 },
						{ validate: validate2, onChange: true, key: 1 },
					],
					async: [],
				},
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			};
			const asyncValidatorState = {};
			const errorMap = signal<
				Partial<Record<ValidatorEvents, ValidationError>>
			>({});
			const isValidating = signal(false);
			const accumulateErrors = true;

			await validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			expect(validate).toHaveBeenCalledWith(value);
			expect(validate2).toHaveBeenCalledWith(value);
			expect(errorMap.value).toEqual({ onChange: "error" });
		});
		it("should abort async validations if there was another validation before the promise resolved", async () => {
      vi.useFakeTimers();
			const value = "test";
			const event = "onChange" as ValidatorEvents;
			const validate = vi.fn(() => "error");
			const validators = {
				onChange: {
					sync: [],
					async: [
						{
							validate: async (_: unknown, signal: AbortSignal) => {
								await new Promise((resolve) => setTimeout(resolve, 100));
                if(signal.aborted) return;
								validate();
								return "error";
							},
							isAsync: true as const,
							onChange: true,
							key: 1,
						},
					],
				},
				onBlur: { sync: [], async: [] },
				onSubmit: { sync: [], async: [] },
				onMount: { sync: [], async: [] },
			};
			const asyncValidatorState = {};
			const errorMap = signal<
				Partial<Record<ValidatorEvents, ValidationError>>
			>({});
			const isValidating = signal(false);
			const accumulateErrors = false;

			const promise = validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			await vi.advanceTimersByTimeAsync(50);
			const promise2 = validateWithValidators(
				value,
				event,
				validators,
				asyncValidatorState,
				errorMap,
				isValidating,
				accumulateErrors,
			);
			await vi.advanceTimersByTimeAsync(100);
			await Promise.all([promise, promise2]);

			expect(validate).toHaveBeenCalledOnce();
			expect(errorMap.value).toEqual({ onChange: "error" });
      vi.useRealTimers();
		});
		it("should abort other async validations if one validation failed unless configured otherwise", async () => {
      vi.useFakeTimers();
      const value = "test";
      const event = "onChange" as ValidatorEvents;
      const validate = vi.fn(() => "error");
      const validate2 = vi.fn(() => "error");
      const validators = {
        onChange: {
          sync: [],
          async: [
            {
              validate: async (_: unknown, signal: AbortSignal) => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                if(signal.aborted) return;
                validate();
                return "error";
              },
              isAsync: true as const,
              onChange: true,
              key: 1,
            },
            {
              validate: async (_: unknown, signal: AbortSignal) => {
                await new Promise((resolve) => setTimeout(resolve, 200));
                if(signal.aborted) return;
                validate2();
                return "error";
              },
              isAsync: true as const,
              onChange: true,
              key: 2,
            },
          ],
        },
        onBlur: { sync: [], async: [] },
        onSubmit: { sync: [], async: [] },
        onMount: { sync: [], async: [] },
      };
      const asyncValidatorState = {};
      const errorMap = signal<
        Partial<Record<ValidatorEvents, ValidationError>>
      >({});
      const isValidating = signal(false);
      const accumulateErrors = false;

      const promise = validateWithValidators(
        value,
        event,
        validators,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      );
      await vi.advanceTimersByTimeAsync(50);
      const promise2 = validateWithValidators(
        value,
        event,
        validators,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      );
      await vi.advanceTimersByTimeAsync(200);
      await Promise.all([promise, promise2]);

      expect(validate).toHaveBeenCalledOnce();
      expect(validate2).not.toHaveBeenCalled();
      expect(errorMap.value).toEqual({ onChange: "error" });
      vi.useRealTimers();
    });
		it("should not abort other async validations if accumulating errors", async () => {
      vi.useFakeTimers();
      const value = "test";
      const event = "onChange" as ValidatorEvents;
      const validate = vi.fn(() => "error");
      const validate2 = vi.fn(() => "error");
      const validators = {
        onChange: {
          sync: [],
          async: [
            {
              validate: async (_: unknown, signal: AbortSignal) => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                if(signal.aborted) return;
                validate();
                return "error";
              },
              isAsync: true as const,
              onChange: true,
              key: 1,
            },
            {
              validate: async (_: unknown, signal: AbortSignal) => {
                await new Promise((resolve) => setTimeout(resolve, 200));
                if(signal.aborted) return;
                validate2();
                return "error";
              },
              isAsync: true as const,
              onChange: true,
              key: 2,
            },
          ],
        },
        onBlur: { sync: [], async: [] },
        onSubmit: { sync: [], async: [] },
        onMount: { sync: [], async: [] },
      };
      const asyncValidatorState = {};
      const errorMap = signal<
        Partial<Record<ValidatorEvents, ValidationError>>
      >({});
      const isValidating = signal(false);
      const accumulateErrors = true;

      const promise = validateWithValidators(
        value,
        event,
        validators,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      );
      await vi.advanceTimersByTimeAsync(50);
      const promise2 = validateWithValidators(
        value,
        event,
        validators,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      );
      await vi.advanceTimersByTimeAsync(200);
      await Promise.all([promise, promise2]);

      expect(validate).toHaveBeenCalledOnce();
      expect(validate2).toHaveBeenCalledOnce();
      expect(errorMap.value).toEqual({ onChange: "error" });
      vi.useRealTimers();
    });
    it("should debounce the validation", async () => {
      vi.useFakeTimers()
      const value = "test";
      const event = "onChange" as ValidatorEvents;
      const validate = vi.fn(() => "error");
      const validators = {
        onChange: {
          sync: [],
          async: [
            {
              validate: async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return "error";
              },
              isAsync: true as const,
              onChange: true,
              key: 1,
              debounceMs: 100,
            },
          ],
        },
        onBlur: { sync: [], async: [] },
        onSubmit: { sync: [], async: [] },
        onMount: { sync: [], async: [] },
      };
      const asyncValidatorState = {};
      const errorMap = signal<
        Partial<Record<ValidatorEvents, ValidationError>>
      >({});
      const isValidating = signal(false);
      const accumulateErrors = false;

      const promise = validateWithValidators(
        value,
        event,
        validators,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      );
      await vi.advanceTimersByTimeAsync(50);
      const promise2 = validateWithValidators(
        value,
        event,
        validators,
        asyncValidatorState,
        errorMap,
        isValidating,
        accumulateErrors,
      );
      await vi.advanceTimersByTimeAsync(200);
      await Promise.all([promise, promise2]);

      expect(validate).not.toHaveBeenCalledTimes(1);
      expect(errorMap.value).toEqual({ onChange: "error" });

      vi.useRealTimers()
    });
	});
});

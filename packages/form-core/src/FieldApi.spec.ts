import { describe, expect, it, vi } from "vitest";
import { FormApi } from "./FormApi";
import { FieldApi } from "./FieldApi";
import { effect } from "@preact/signals";

describe("FieldAPI", () => {
	describe("construction", () => {
		it("should use the given default values", () => {
			const form = new FormApi<{ name: string }>({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name", {
				defaultValue: "default",
			});

			expect(field.signal?.value).toBe("default");
		});
		it("should deeply signalify the default value", () => {
			const form = new FormApi({
				defaultValues: {
					name: {
						deepArray: [
							undefined,
							{
								nested: [["string"]],
							},
							// TODO If I do this as `as const` it does not work
						],
					},
				},
			});

			const field = new FieldApi(form, "name.deepArray.1.nested.0.0", {
				defaultValue: "default",
			});

			expect(field.signal?.value).toBe("default");
		});
		it("should fall back on the form default values", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");

			expect(field.signal?.value).toBe("test");
		});
		it("should have default state in beginning (not dirty, not validating, no errors, not touched, isValid)", () => {
			const form = new FormApi<{ name: string }>();
			const field = new FieldApi(form, "name");

			expect(field.signal.value).toBeUndefined();
			expect(field.isDirty.value).toBe(false);
			expect(field.isValidating.value).toBe(false);
			expect(field.errors.value).toEqual([]);
			expect(field.isTouched.value).toBe(false);
			expect(field.isValid.value).toBe(true);
		});
		it("should be able to set default state of isTouched to true", () => {
			const form = new FormApi<{ name: string }>();
			const field = new FieldApi(form, "name", {
				defaultState: {
					isTouched: true,
				},
			});

			expect(field.isTouched.value).toBe(true);
		});
	});
	describe("value", () => {
		it("should return the value from the form", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");
			form.state.value.name.value = "new value";

			expect(field.signal.value).toBe("new value");
		});
		it("should return the value as a reactive signal", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");

			const spy = vi.fn();
			effect(() => {
				spy(field.signal.value);
			});
			form.state.value.name.value = "new value";

			expect(spy).toBeCalledWith("new value");
		});
		it("should set the value in the form", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");

			field.handleChange("new value");

			expect(form.state.value.name.value).toBe("new value");
		});
		it("should reactively insert a value into the array", () => {
			const form = new FormApi({
				defaultValues: {
					array: [1, undefined, 3],
				},
			});

			const field = new FieldApi(form, "array" as const);
			field.insertValueInArray(1, 2);

			expect(field.signal.value[1].signal.value).toBe(2);
		});
		it("should reactively push a value to the array", () => {
			const form = new FormApi({
				defaultValues: {
					array: [1, undefined, 3],
				},
			});

			const field = new FieldApi(form, "array" as const);
			field.pushValueToArray(4);

			expect(field.signal.value[3].signal.value).toBe(4);
		});
		it("should reactively remove a value from the array", () => {
			const form = new FormApi({
				defaultValues: {
					array: [1, 2, 3],
				},
			});

			const field = new FieldApi(form, "array" as const);

			expect(field.signal.value.length).toBe(3);
			field.removeValueFromArray(1);

			expect(field.signal.value.length).toBe(2);
		});
		it("should reactively update a value in the array", async () => {
			const form = new FormApi({
				defaultValues: {
					array: [1, 2, 3],
				},
			});

			const field = new FieldApi(form, "array" as const);

			const spy = vi.fn();
			effect(() => {
				spy(field.signal.value);
			});
			field.pushValueToArray(4);

			// We are checking the second call, since the effect will be called once with the current value
			const call = spy.mock.calls[1];
			expect(call[0].length).toBe(4);
		});
		it("should do nothing when trying to insert a value into a non-array field", () => {
			const form = new FormApi({
				defaultValues: {
					someVal: 1,
				},
			});

			const field = new FieldApi(form, "someVal");

			expect(field.signal.value).toBe(1);
			field.insertValueInArray(1, 2 as never);

			expect(field.signal.value).toBe(1);
		});
	});
	describe("validation", () => {
		it.todo("should validate the value");
		it.todo("should work with async validators");
		it.todo("should debounce the validation");
		it.todo("should validate after change");
		it.todo("should validate after blur");
		it.todo("should validate after mount");
		it.todo("should validate after submit of the form");
		it.todo("should reset the change errors after change");
		it.todo("should reset the blur errors after blur");
		it.todo("should reset the submit errors after submit");
		it.todo("should reset all errors after submit");
		it.todo("should abort async validations with an abort signal");
	});
	describe("state", () => {
		it("should be dirty if the value has changed", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");

			expect(field.isDirty.value).toBe(false);
			field.handleChange("new value");

			expect(field.isDirty.value).toBe(true);
		});
		it("should be touched after it was blurred", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");

			expect(field.isTouched.value).toBe(false);
			field.handleBlur();

			expect(field.isTouched.value).toBe(true);
		});
		it("should be touched after its value was changed", () => {
			const form = new FormApi({
				defaultValues: {
					name: "test",
				},
			});

			const field = new FieldApi(form, "name");

			expect(field.isTouched.value).toBe(false);
			field.handleChange("new value");

			expect(field.isTouched.value).toBe(true);
		});
		it.todo("should have a list of errors after validating erroneous values");
		it.todo("should reset the state after reset the form");
		it.todo("should reset the state after reset the field");
		it.todo(
			"should not reset the state after reset the form if ignoring dirty fields and is dirty",
		);
		it.todo(
			"should reset the state after reset the form if ignoring dirty fields and is not dirty",
		);
		// TODO Figure out what I want to do for the mounting and unmounting
		it.todo("should preserve field state on unmount if configured");
		it.todo("should reset field state on unmount if not otherwise configured");
		it.todo("should show the validating state while doing async validation");
	});
});

// TODO add type tests with vitest

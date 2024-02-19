import { describe, assertType, it, expectTypeOf } from "vitest";
import { FormApi } from "./FormApi";
import { FieldApi } from "./FieldApi";
import { Signal } from "@preact/signals";

describe("FieldApi (types)", () => {
	describe("passing types", () => {
		it("should get the correct primitive type for strings", () => {
			const form = new FormApi<{ name: string }>();
			const field = new FieldApi(form, "name");

			assertType<string>(field.signal.value);
		});
		it("should get the correct primitive type for numbers", () => {
			const form = new FormApi<{ age: number }>();
			const field = new FieldApi(form, "age");

			assertType<number>(field.signal.value);
		});
		it("should get the correct primitive type for booleans", () => {
			const form = new FormApi<{ isHuman: boolean }>();
			const field = new FieldApi(form, "isHuman");

			assertType<boolean>(field.signal.value);
		});
		it("should get the correct primitive type for dates", () => {
			const form = new FormApi<{ birthday: Date }>();
			const field = new FieldApi(form, "birthday");

			assertType<Date>(field.signal.value);
		});
		it("should get the correct constant type for strings", () => {
			const form = new FormApi<{ name: "John" | "Lee" }>();
			const field = new FieldApi(form, "name");

			assertType<"John" | "Lee">(field.signal.value);
		});
	});
	describe("inferring types", () => {
		it("should infer the primitive string type of a field from the default value", () => {
			const form = new FormApi({ defaultValues: { name: "John" } });
			const field = new FieldApi(form, "name");

			assertType<string>(field.signal.value);
		});
		it("should infer the primitive number type of a field from the default value", () => {
			const form = new FormApi({ defaultValues: { age: 25 } });
			const field = new FieldApi(form, "age");

			assertType<number>(field.signal.value);
		});
		it("should infer the primitive boolean type of a field from the default value", () => {
			const form = new FormApi({ defaultValues: { isHuman: true } });
			const field = new FieldApi(form, "isHuman");

			assertType<boolean>(field.signal.value);
		});
		it("should infer the primitive date type of a field from the default value", () => {
			const form = new FormApi({ defaultValues: { birthday: new Date() } });
			const field = new FieldApi(form, "birthday");

			assertType<Date>(field.signal.value);
		});
		it("should infer the constant type of a field from the default value", () => {
			const form = new FormApi({ defaultValues: { name: "John" as const } });
			const field = new FieldApi(form, "name");

			assertType<"John">(field.signal.value);
		});
	});
	describe("array types", () => {
		it("should type the array items with keys and signals separately", () => {
			const form = new FormApi<{ names: string[] }>();
			const field = new FieldApi(form, "names" as const);

			assertType<{ key: number; signal: Signal<string> }[]>(field.signal.value);
		});
		it("should type the members of an array", () => {
			const form = new FormApi<{ names: string[] }>();
			const field = new FieldApi(form, "names.0" as const);

			assertType<string>(field.signal.value);
		});
		it("should infer the type of the array members from the default value", () => {
			const form = new FormApi({ defaultValues: { names: ["John"] } });
			const field = new FieldApi(form, "names" as const);

			assertType<Array<{ key: number; signal: Signal<string> }>>(
				field.signal.value,
			);
		});
		it("should infer the type of all tuple members from the default value", () => {
			const form = new FormApi({
				defaultValues: { names: ["John", "Lee"] as const },
			});
			const field = new FieldApi(form, "names" as const);

			assertType<
				[
					{ key: number; signal: Signal<"John"> },
					{ key: number; signal: Signal<"Lee"> },
				]
			>(field.signal.value);
		});
		it("should type the members of a tuple in subfields", () => {
			const form = new FormApi<{ names: [string, number] }>();
			const field1 = new FieldApi(form, "names.0" as const);
			const field2 = new FieldApi(form, "names.1" as const);

			assertType<string>(field1.signal.value);
			assertType<number>(field2.signal.value);
		});
    it("should not allow to push values into a tuple", () => {
      const form = new FormApi<{ names: readonly [string, number] }>();
      const field = new FieldApi(form, "names" as const);

      expectTypeOf(field.pushValueToArray).parameter(0).toBeNever()
    })
    it("should not allow to remove values from a tuple", () => {
      const form = new FormApi<{ names: readonly [string, number] }>();
      const field = new FieldApi(form, "names" as const);

      expectTypeOf(field.removeValueFromArray).parameter(0).toBeNever()
    })
    it("should only allow to insert the type of the tuple at a specific index", () => {
      const form = new FormApi<{ names: readonly [string, number] }>();
      const field = new FieldApi(form, "names" as const);

      expectTypeOf(field.insertValueInArray<0>).parameter(1).toBeString()
      expectTypeOf(field.insertValueInArray<1>).parameter(1).toBeNumber()
    })
    it("should only allow to swap indexes in a tuple if the types are the same", () => {
      const form = new FormApi<{ names: readonly [string, number, string] }>();
      const field = new FieldApi(form, "names" as const);

      // You cannot swap a string with a number
      expectTypeOf(field.swapValuesInArray<0, 1>).parameter(0).toBeNever()
      // You can swap two strings
      expectTypeOf(field.swapValuesInArray<0, 2>).parameter(0).toBeNumber()
    })
	});
	describe("nested types", () => {
		it("should type all nested fields as signals", () => {
			type Val = {
				nested: {
					deep: {
						num: number;
					};
				};
			};
			const form = new FormApi<Val>();
			const field = new FieldApi(form, "nested" as const);

			assertType<
				Signal<{
					deep: Signal<{
						num: Signal<number>;
					}>;
				}>
			>(field.signal);
		});
		it("should deeply signalify array data based on the default value", () => {
			const form = new FormApi({
				defaultValues: {
					dateRange: [new Date(), new Date()] as const,
					prices: {
						EUR: [
							{ id: "id1", value: 10, count: 1 },
							{ id: "id2", value: 20, count: 2 },
						],
					},
				},
			});
			const fieldTuple = new FieldApi(form, "dateRange" as const);
			const fieldPrices = new FieldApi(form, "prices" as const);
			const fieldPricesEur = new FieldApi(form, "prices.EUR" as const);
			const fieldPricesEurEl = new FieldApi(form, "prices.EUR.0" as const);

			assertType<
				[
					{ key: number; signal: Signal<Date> },
					{ key: number; signal: Signal<Date> },
				]
			>(fieldTuple.signal.value);
			assertType<{
				EUR: Signal<
					Array<{
						key: number;
						signal: Signal<{
							id: Signal<string>;
							value: Signal<number>;
							count: Signal<number>;
						}>;
					}>
				>;
			}>(fieldPrices.signal.value);
			assertType<
				Array<{
					key: number;
					signal: Signal<{
						id: Signal<string>;
						value: Signal<number>;
						count: Signal<number>;
					}>;
				}>
			>(fieldPricesEur.signal.value);
			assertType<{
				id: Signal<string>;
				value: Signal<number>;
				count: Signal<number>;
			}>(fieldPricesEurEl.signal.value);
		});
	});
	describe("validator", () => {
		it("should infer the type of the value from the validator", () => {
			const form = new FormApi<{ name: string }>();
			new FieldApi(form, "name", {
				validators: [
					{
						validate: (value) => {
							assertType<string>(value);
							return undefined;
						},
					},
				],
			});
		});
		it("should infer the type of the value from the async validator", () => {
			const form = new FormApi<{ name: string }>();
			new FieldApi(form, "name", {
				validators: [
					{
						isAsync: true,
						validate: async (value) => {
							assertType<string>(value);
							return undefined;
						},
					},
				],
			});
		});
		it("should infer the nested array type of the value form the validator", () => {
			const form = new FormApi<{ names: { lastNames: string[] } }>();
			new FieldApi(form, "names.lastNames.0" as const, {
				validators: [
					{
						validate: (value) => {
							assertType<string>(value);
							return undefined;
						},
					},
				],
			});
			it("should use the unsignalified value for the validator", () => {
				const form = new FormApi<{ name: { first: string; last: string } }>();
				new FieldApi(form, "name" as const, {
					validators: [
						{
							validate: (value) => {
								assertType<{ first: string; last: string }>(value);
								return undefined;
							},
						},
					],
				});
			});
		});
	});
});

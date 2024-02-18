import { type FormApi } from "./FormApi";
import { Paths, ValueAtPath } from "./types.utils";
import { computed, effect, ReadonlySignal, signal } from "@preact/signals";
import { Validator, ValidatorAsync, ValidatorSync } from "./validators";
import { makeArrayEntry } from "./signals.utils";

interface FieldApiOptions<TValue, TName extends Paths<TValue>, TOutput> {
	/**
	 * Validators to run on fields
	 */
	validators?: Validator<ValueAtPath<TValue, TName>>[];
	/**
	 * Default value for the field
	 */
	defaultValue?: ValueAtPath<TValue, TName>;
	defaultState?: {
		isTouched?: boolean;
	};
	/**
	 * Whether the value should be preserved once the field is unmounted
	 */
	preserveValueOnUnmount?: boolean;
}

let ValidatorKeys = 0;
type WithKey = { key: number };
type ValidatorEvents = "onChange" | "onBlur" | "onSubmit" | "onMount";

export class FieldApi<TValue, TName extends Paths<TValue>, TOutput = never> {
	//region State
	// TODO Think about scenarios where value changes should not trigger the touched state (e.g. inserting a value into an array)
	private readonly _isTouched = signal(false);
	private readonly _isTouchedReadOnly = computed(() => this._isTouched.value);
	private readonly _isValidating = signal(false);
	private readonly _isValidatingReadOnly = computed(
		() => this._isValidating.value,
	);
	private readonly _errorMap = signal<Record<number, string[]>>({});

	private readonly _isValid: ReadonlySignal<boolean> = computed(() => {
		return !this.errors.value.length;
	});
	private readonly _isDirty: ReadonlySignal<boolean> = computed(() => {
		// TODO Better comparison
		return this._defaultValue !== this.signal.value;
	});
	/**
	 * @NOTE on errors
	 * Each validator can trigger its own errors and can overwrite only its own errors
	 * Each list of errors is stored with a key that is unique to the validator, therefore, only this validator can overwrite it
	 */
	private readonly _errors = computed(() => {
		const errorMap = this._errorMap.value;
		return Object.values(errorMap).flat();
	});
	//endregion

	private readonly _validators: Record<
		ValidatorEvents,
		{
			sync: Array<ValidatorSync<ValueAtPath<TValue, TName>> & WithKey>;
			async: Array<ValidatorAsync<ValueAtPath<TValue, TName>> & WithKey>;
		}
	>;

	private _isMounted = false;
	private readonly _unsubscribeFromChangeEffect: () => void;

	// TODO If the _name is not a constant this could lead to some type errors
	constructor(
		private readonly _form: FormApi<TValue>,
		private readonly _name: TName,
		private readonly _options?: FieldApiOptions<TValue, TName, TOutput>,
	) {
		this._form.registerField(_name, this, _options?.defaultValue);

		if (_options?.defaultState?.isTouched) this._isTouched.value = true;

		this._validators = {
			onChange: {
				sync: [],
				async: [],
			},
			onBlur: {
				sync: [],
				async: [],
			},
			onSubmit: {
				sync: [],
				async: [],
			},
			onMount: {
				sync: [],
				async: [],
			},
		};

		if (this._options?.validators) {
			for (const validator of this._options.validators) {
				const events = [
					validator.onChange && "onChange",
					validator.onBlur && "onBlur",
					validator.onSubmit && "onSubmit",
					validator.onMount && "onMount",
				].filter(Boolean) as Array<ValidatorEvents>;

				for (const event of events) {
					const validatorWithKey = { ...validator, key: ValidatorKeys++ };
					if (validatorWithKey.isAsync) {
						this._validators[event].async.push(validatorWithKey);
					} else {
						this._validators[event].sync.push(validatorWithKey);
					}
				}
			}
		}

		this._unsubscribeFromChangeEffect = effect(() => {
			const currentValue = this.signal.value;
			if (!this._isMounted) {
				return;
			}
			this._isTouched.value = true;

			// The value has to be passed here so that the effect subscribes to it
			this.validateForEvent("onChange", currentValue);
		});
	}

	public validateForEvent(
		event: ValidatorEvents,
		checkValue?: ValueAtPath<TValue, TName>,
	) {
		const validators = this._validators[event];
		const value = checkValue ?? this.signal.value;
		// TODO Implement
		console.log("Validating", event, value);
	}

	//region Lifecycle
	mount() {
		this._isMounted = true;
		this.validateForEvent("onMount");
	}

	unmount() {
    this._isMounted = false;
		this._unsubscribeFromChangeEffect();

		this._form.unregisterField(this._name, this._options?.preserveValueOnUnmount);
	}
	//endregion

	//region Handlers
	/**
	 * Handle a change in the field value. You can also directly set the value of the field with `field.signal.value = newValue`.
	 * This is just a convenience method to be passed as a method reference.
	 * @param newValue The new value of the field
	 */
	handleChange(newValue: ValueAtPath<TValue, TName>) {
		this.signal.value = newValue;
	}

	handleBlur() {
		this._isTouched.value = true;
		this.validateForEvent("onBlur");
	}

	handleSubmit() {
		this.validateForEvent("onSubmit");

		// If there are any errors, we don't want to submit the form
		if (!this.isValid.value) {
			return;
		}
    return this.signal.value;
	}
	//endregion

	//region Value Helpers
	/**
	 * Insert a value into an array. If the field is not an array it will throw an error. For readonly arrays you can only insert values at existing indexes with the correct types.
	 * This method should not be used to update the value of an array item, use `field.signal.value[index].value = newValue` instead.
	 * @param index The index to insert the value at (if there already is a value at this index, it will be overwritten without triggering a reactive update of that value and the array item key will change)
	 * @param value The value to insert
	 */
	insertValueInArray<Index extends number>(
		index: Index,
		// biome-ignore lint/suspicious/noExplicitAny: Could be any array
		value: ValueAtPath<TValue, TName> extends any[]
			? ValueAtPath<TValue, TName>[number]
			: // biome-ignore lint/suspicious/noExplicitAny: Could be any array
			  ValueAtPath<TValue, TName> extends readonly any[]
			  ? ValueAtPath<TValue, TName>[Index]
			  : never,
	) {
		const currentValue = this.signal.value;
		if (!Array.isArray(currentValue)) {
			// TODO Add internal logging module
			// TODO Check what happenes with tanstack
			console.error("Tried to insert a value into a non-array field");
			return;
		}
		const arrayCopy = [...currentValue] as ValueAtPath<TValue, TName> &
			Array<any>;
		arrayCopy[index] = makeArrayEntry(value);
		this.signal.value = arrayCopy as typeof currentValue;
	}

	/**
	 * Push a value to an array. If the field is not an array it will throw an error. You should also not push a value to a readonly array, this is also intended to give type errors.
	 * @param value The value to push to the array
	 */
	pushValueToArray(
		// biome-ignore lint/suspicious/noExplicitAny: Could be any array
		value: ValueAtPath<TValue, TName> extends any[]
			? ValueAtPath<TValue, TName>[number]
			: never,
	) {
		const currentValue = this.signal.value;
		if (!Array.isArray(currentValue)) {
			// TODO Add internal logging module
			// TODO Check what happenes with tanstack
			console.error("Tried to push a value into a non-array field");
			return;
		}

		const arrayCopy = [...currentValue] as ValueAtPath<TValue, TName> &
			Array<any>;
		arrayCopy.push(makeArrayEntry(value));
		this.signal.value = arrayCopy as typeof currentValue;
	}

	/**
	 * Remove a value from an array. If the field is not an array it will throw an error. You should also not remove a value from a readonly array, this is also intended to give type errors.
	 * Removing a value will shift the index of all its following values, the key for all the items will stay the same.
	 * @param index The index of the value to remove
	 */
	removeValueFromArray(
		// biome-ignore lint/suspicious/noExplicitAny: Could be any array
		index: ValueAtPath<TValue, TName> extends any[] ? number : never,
	) {
		const currentValue = this.signal.value;
		if (!Array.isArray(currentValue)) {
			// TODO Add internal logging module
			// TODO Check what happenes with tanstack
			console.error("Tried to remove a value from a non-array field");
			return;
		}
		this.signal.value = [...currentValue].filter(
			(_, i) => i !== index,
		) as typeof currentValue;
	}
	//endregion

	//region State
	/**
	 * The reactive signal of the fields value, you can get, subscribe and set the value of the field with this signal.
	 */
	get signal() {
		return this._form.getValueForPath(this._name);
	}

	get isValidating() {
		return this._isValidatingReadOnly;
	}

	get errors() {
		return this._errors;
	}

	get isValid() {
		return this._isValid;
	}

	get isTouched() {
		return this._isTouchedReadOnly;
	}

	get isDirty() {
		return this._isDirty;
	}

	get isMounted() {
		return this._isMounted;
	}
	//endregion

	private get _defaultValue() {
		return (
			this._options?.defaultValue ??
			this._form.getDefaultValueForPath(this._name)
		);
	}
}
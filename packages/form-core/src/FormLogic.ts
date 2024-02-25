import {
  deepSignalifyValue,
  getSignalValueAtPath,
  getValueAtPath, makeArrayEntry,
  removeSignalValueAtPath,
  setSignalValueAtPath,
  SignalifiedData,
  unSignalifyValue,
} from "./signals.utils";
import { Paths, ValueAtPath } from "./types.utils";
import { batch, computed, effect, signal } from "@preact/signals";
import { FieldLogic } from "./FieldLogic";
import {
	groupValidators,
	validateWithValidators,
	Validator,
	ValidatorAsync,
	ValidatorEvents,
	ValidatorSync,
	WithKey,
} from "./validators";

type FormLogicOptions<TData> = {
	/**
	 * Validators to run on the whole form
	 */
	validators?: Validator<TData>[];
  /**
   * If true, all errors on validators will be accumulated and validation will not stop on the first error
   */
	accumulateErrors?: boolean;
	/**
	 * Default values for the form
	 */
	defaultValues?: TData;
	onSubmit?: (data: TData) => void | Promise<void>;
};

export class FormLogic<TData> {
	/**
	 * Single source of truth for the form data
	 * @private
	 */
	private readonly _data: SignalifiedData<TData>;
	private readonly _jsonData = computed(() => {
		const unSignalifyValue = <T>(value: SignalifiedData<T>): T => {
			const currentValue =
				typeof value === "object" && "value" in value ? value.value : value;

			if (Array.isArray(currentValue)) {
				return currentValue.map((entry) => unSignalifyValue(entry.signal)) as T;
			}

			if (
				currentValue instanceof Date ||
				typeof currentValue !== "object" ||
				currentValue === null ||
				currentValue === undefined
			) {
				return currentValue as T;
			}

			return Object.fromEntries(
				Object.entries(currentValue).map(([key, value]) => [
					key,
					unSignalifyValue(value),
				]),
			) as T;
		};
		return unSignalifyValue(this._data);
	});

	/**
	 * Errors specific for the whole form
	 * @private
	 */
	private readonly _errorMap = signal<
		Partial<Record<ValidatorEvents, string | undefined>>
	>({});
	/**
	 * @NOTE on errors
	 * Each validator can trigger its own errors and can overwrite only its own errors
	 * Each list of errors is stored with a key that is unique to the validator, therefore, only this validator can overwrite it
	 */
	private readonly _errors = computed(() => {
		const errorMap = this._errorMap.value;
		return Object.values(errorMap).flat().filter(Boolean);
	});
	private readonly _isValidForm = computed(() => !this._errors.value.length);
	private readonly _isValidFields = computed(() => {
		const fields = this.fields;
		return fields.every((field) => field.isValid.value);
	});
	private readonly _isValid = computed(
		() => this._isValidForm.value && this._isValidFields.value,
	);

	private readonly _isTouched = computed(() => {
		return this.fields.some((field) => field.isTouched.value);
	});

	private readonly _isDirty = computed(() => {
		return this.fields.some((field) => field.isDirty.value);
	});

	private readonly _submitCountSuccessful = signal(0);
	private readonly _submitCountUnsuccessful = signal(0);
	private readonly _submitCount = computed(
		() =>
			this._submitCountSuccessful.value + this._submitCountUnsuccessful.value,
	);

	private readonly _isValidatingForm = signal(false);
	private readonly _isValidatingFields = computed(() => {
		return this.fields.some((field) => field.isValidating.value);
	});
	private readonly _isValidating = computed(
		() => this._isValidatingForm.value || this._isValidatingFields.value,
	);

	private readonly _isSubmitting = signal(false);
	private readonly _isSubmitted = computed(() => {
		return !this._isSubmitting.value && this._submitCount.value > 0;
	});

  private readonly _canSubmit = computed(() => {
    return !this._isSubmitting.value && !this._isValidating.value && this._isValid.value;
  })

	/**
	 * Map of all the fields in the form
	 * @private
	 */
	private readonly _fields: Map<Paths<TData>, FieldLogic<TData, Paths<TData>>>;

	private readonly _validators: Record<
		ValidatorEvents,
		{
			sync: Array<ValidatorSync<TData> & WithKey>;
			async: Array<ValidatorAsync<TData> & WithKey>;
		}
	>;
	private readonly _asyncValidationState: Record<number, AbortController> = {};

	private _unsubscribeFromChangeEffect?: () => void;
	private _isMounted = false;

	constructor(private readonly _options?: FormLogicOptions<TData>) {
		if (this._options?.defaultValues) {
			this._data = deepSignalifyValue(this._options.defaultValues);
		} else {
			this._data = signal({}) as SignalifiedData<TData>;
		}
		this._fields = new Map();

		this._validators = groupValidators(this._options?.validators);
	}

	//region State
	public get data() {
		// This is not really always the full data, but this way you get type safety
		return this._data;
	}

	public get json() {
		// This is not really always the full data, but this way you get type safety
		return this._jsonData;
	}

	public get errors() {
		return this._errors;
	}

	public get fields() {
		return Array.from(this._fields.values());
	}

	public get isValidForm() {
		return this._isValidForm;
	}

	public get isValidFields() {
		return this._isValidFields;
	}

	public get isValid() {
		return this._isValid;
	}

	public get isTouched() {
		return this._isTouched;
	}

	public get isDirty() {
		return this._isDirty;
	}

  /**
   * The amount of times the form finished submission successfully
   */
	public get submitCountSuccessful() {
		return this._submitCountSuccessful;
	}

  /**
   * The amount of times the form finished submission with either validation errors or a failing onSubmit function
   */
	public get submitCountUnsuccessful() {
		return this._submitCountUnsuccessful;
	}

  /**
   * The amount of times the form finished submission, regardless of the outcome
   */
	public get submitCount() {
		return this._submitCount;
	}

	public get isValidatingForm() {
		return this._isValidatingForm;
	}

	public get isValidatingFields() {
		return this._isValidatingFields;
	}

	public get isValidating() {
		return this._isValidating;
	}

	public get isSubmitting() {
		return this._isSubmitting;
	}

	public get isSubmitted() {
		return this._isSubmitted;
	}

  public get canSubmit() {
    return this._canSubmit;
  }

	public validateForEvent(event: ValidatorEvents, checkValue?: TData) {
		if (!this._isMounted && event !== "onSubmit") return;

		const value = checkValue ?? unSignalifyValue(this.data);
		return validateWithValidators(
			value,
			event,
			this._validators,
			this._asyncValidationState,
			this._errorMap,
			this._isValidatingForm,
			this._options?.accumulateErrors,
		);
	}
	//endregion

	//region Functions
  public handleBlur = async () => {
    if (!this._isMounted) return;
    await this.validateForEvent("onBlur");
  }

	public handleSubmit = async () => {
		if (!this._isMounted || !this.canSubmit.peek()) return;

    // TODO Only await if the the validators are async
		const onFinished = (successful: boolean) => {
			batch(() => {
				if (successful) {
					this._submitCountSuccessful.value++;
				} else {
					this._submitCountUnsuccessful.value++;
				}
				this._isSubmitting.value = false;
			});
		};

		this._isSubmitting.value = true;
    await Promise.all([
      this.validateForEvent("onSubmit"),
      ...this.fields.map((field) => field.handleSubmit()),
    ]);

		if (!this._isValid.peek()) {
			onFinished(false);
			return;
		}

    const currentJson = this._jsonData.peek();

		if (this._options?.onSubmit) {
			try {
				const res = Promise.resolve(this._options.onSubmit(currentJson));

        if("then" in res) {
          await res.then((res) => {
            onFinished(true);
            return res;
          });
        } else {
          onFinished(true);
        }
			} catch (e) {
				onFinished(false);
				throw e;
			}
		} else {
      onFinished(true);
    }
	};
	//endregion

	//region Lifecycle
	public async mount() {
		// Once mounted, we want to listen to all changes to the form
		this._unsubscribeFromChangeEffect?.();
		this._unsubscribeFromChangeEffect = effect(async () => {
			const currentJson = this._jsonData.value;
      // TODO Currently this also runs if a field is registered, since the value is set to undefined, unsure if this is the expected behaviour

			// Clear all onSubmit errors when the value changes
			const { onSubmit: _, ...errors } = this._errorMap.peek();
			this._errorMap.value = errors;

			if (!this._isMounted) {
				return;
			}

			await this.validateForEvent("onChange", currentJson as TData);
		});

		this._isMounted = true;
		await this.validateForEvent("onMount");
	}

	public unmount() {
		this._isMounted = false;

		this._unsubscribeFromChangeEffect?.();
	}
	//endregion

	//region Field helpers
	public registerField<TPath extends Paths<TData>>(
		path: TPath,
		field: FieldLogic<TData, TPath>,
		defaultValues?: ValueAtPath<TData, TPath>,
	) {
		// This might be the case if a field was unmounted and preserved its value, in that case we do not want to do anything
		if (this._fields.has(path)) return;

		this._fields.set(path, field);
		if (defaultValues === undefined) return;
		setSignalValueAtPath<TData, TPath>(this._data, path, defaultValues);
	}

	public unregisterField<TPath extends Paths<TData>>(
		path: TPath,
		preserveValue?: boolean,
	) {
		if (preserveValue) return;
		this._fields.delete(path);
		removeSignalValueAtPath(this._data, path);
	}
	//endregion

	//region Value helpers
	public getDefaultValueForPath<TPath extends Paths<TData>>(
		path: TPath,
	): ValueAtPath<TData, TPath> | undefined {
		return getValueAtPath<TData, TPath>(this._options?.defaultValues, path);
	}

	public getValueForPath<TPath extends Paths<TData>>(
		path: TPath,
	): SignalifiedData<ValueAtPath<TData, TPath>> {
		const value = getSignalValueAtPath<TData, TPath>(this._data, path);
		if (value) return value;

		const createdValue = setSignalValueAtPath<TData, TPath>(
			this._data,
			path,
			this.getDefaultValueForPath(path),
		);
		if (!createdValue) throw new Error("Could not create value for path");
		return createdValue;
	}

  public getFieldForPath<TPath extends Paths<TData>>(
    path: TPath,
  ) {
    return this._fields.get(path) as FieldLogic<TData, TPath>;
  }
	//endregion

  //region Array Helpers
  /**
   * Insert a value into an array. If the field is not an array it will throw an error. For readonly arrays you can only insert values at existing indexes with the correct types.
   * This method should not be used to update the value of an array item, use `field.signal.value[index].value = newValue` instead.
   * @param index The index to insert the value at (if there already is a value at this index, it will be overwritten without triggering a reactive update of that value and the array item key will change)
   * @param value The value to insert
   * @param options Options for the insert
   */
  public insertValueInArray<TName extends Paths<TData>, Index extends number>(
    name: TName,
    index: Index,
    // biome-ignore lint/suspicious/noExplicitAny: Could be any array
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : // biome-ignore lint/suspicious/noExplicitAny: Could be any array
      ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[Index]
        : never,
    options?: { shouldTouch?: boolean },
  ) {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value;
    if (!Array.isArray(currentValue)) {
      // TODO Add internal logging module
      // TODO Check what happenes with tanstack
      console.error("Tried to insert a value into a non-array field");
      return;
    }
    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<any>;
    arrayCopy[index] = makeArrayEntry(value);
    batch(() => {
      signal.value = arrayCopy as typeof currentValue;
      if (options?.shouldTouch) {
        this.getFieldForPath(name).handleTouched()
      }
    });
  }

  /**
   * Push a value to an array. If the field is not an array it will throw an error. You should also not push a value to a readonly array, this is also intended to give type errors.
   * @param value The value to push to the array
   * @param options Options for the push
   */
  public pushValueToArray<TName extends Paths<TData>>(
    name: TName,
    // biome-ignore lint/suspicious/noExplicitAny: Could be any array
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ) {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value;
    if (!Array.isArray(currentValue)) {
      // TODO Add internal logging module
      // TODO Check what happenes with tanstack
      console.error("Tried to push a value into a non-array field");
      return;
    }

    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<any>;
    arrayCopy.push(makeArrayEntry(value));
    batch(() => {
      signal.value = arrayCopy as typeof currentValue;
      if (options?.shouldTouch) {
        this.getFieldForPath(name).handleTouched()
      }
    });
  }

  /**
   * Remove a value from an array. If the field is not an array it will throw an error. You should also not remove a value from a readonly array, this is also intended to give type errors.
   * Removing a value will shift the index of all its following values, the key for all the items will stay the same.
   * @param index The index of the value to remove
   * @param options Options for the remove
   */
  public removeValueFromArray<TName extends Paths<TData>>(
    name: TName,
    // biome-ignore lint/suspicious/noExplicitAny: Could be any array
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ) {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value;
    if (!Array.isArray(currentValue)) {
      // TODO Add internal logging module
      // TODO Check what happenes with tanstack
      console.error("Tried to remove a value from a non-array field");
      return;
    }
    batch(() => {
      signal.value = [...currentValue].filter(
        (_, i) => i !== index,
      ) as typeof currentValue;
      if (options?.shouldTouch) {
        this.getFieldForPath(name).handleTouched()
      }
    });
  }

  /**
   * Swap two values in an array. If the field is not an array it will throw an error. You should also not swap values in a readonly array, this is also intended to give type errors.
   * @param indexA The index of the first value to swap
   * @param indexB The index of the second value to swap
   * @param options Options for the swap
   */
  public swapValuesInArray<TName extends Paths<TData>, IndexA extends number, IndexB extends number>(
    name: TName,
    // biome-ignore lint/suspicious/noExplicitAny: This could be any array
    indexA: ValueAtPath<TData, TName> extends any[]
      ? number
      : // biome-ignore lint/suspicious/noExplicitAny: This could be any array
      ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexA] extends ValueAtPath<
            TData,
            TName
          >[IndexB]
          ? number
          : never
        : never,
    // biome-ignore lint/suspicious/noExplicitAny: This could be any array
    indexB: ValueAtPath<TData, TName> extends any[]
      ? number
      : // biome-ignore lint/suspicious/noExplicitAny: This could be any array
      ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexB] extends ValueAtPath<
            TData,
            TName
          >[IndexA]
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ) {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value;
    if (!Array.isArray(currentValue)) {
      // TODO Add internal logging module
      // TODO Check what happenes with tanstack
      console.error("Tried to swap values in a non-array field");
      return;
    }
    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<any>;
    const temp = arrayCopy[indexA];
    arrayCopy[indexA] = arrayCopy[indexB];
    arrayCopy[indexB] = temp;

    batch(() => {
      signal.value = arrayCopy as typeof currentValue;
      if (options?.shouldTouch) {
        this.getFieldForPath(name).handleTouched()
      }
    });
  }
  //endregion
}

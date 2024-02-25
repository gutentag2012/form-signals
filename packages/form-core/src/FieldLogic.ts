import { type FormLogic } from "./FormLogic";
import { Paths, ValueAtPath } from "./types.utils";
import {
  batch,
  computed,
  effect,
  ReadonlySignal,
  signal,
} from "@preact/signals";
import {
  groupValidators, validateWithValidators,
  ValidationError,
  Validator,
  ValidatorAsync,
  ValidatorEvents,
  ValidatorSync,
  WithKey
} from "./validators";
import {
  SignalifiedData,
  unSignalifyValue,
} from "./signals.utils";
import { isDeepEqual } from "./isDeepEqual";

interface FieldLogicOptions<TData, TName extends Paths<TData>> {
  /**
   * Validators to run on fields
   */
  validators?: Validator<ValueAtPath<TData, TName>>[];
  /**
   * If true, all errors on validators will be accumulated and validation will not stop on the first error
   */
  accumulateErrors?: boolean;
  /**
   * Default value for the field
   */
  defaultValue?: ValueAtPath<TData, TName>;
  /**
   * Initial state for the field
   */
  defaultState?: {
    isTouched?: boolean;
    errors?: Partial<Record<ValidatorEvents, ValidationError>>;
  };
  /**
   * Whether the value should be preserved once the field is unmounted. <br/>
   * If true, this field will not run validations and not accept any changes to its value through its handlers. It however can still be submitted and will run validations on submit.
   * @note The signal value will not be locked when unmounted, so if you change the value directly through the signal it will be updated in the form.
   */
  preserveValueOnUnmount?: boolean;
}

export class FieldLogic<TData, TName extends Paths<TData>> {
  //region State
  private readonly _isTouched = signal(false);
  private readonly _isTouchedReadOnly = computed(() => this._isTouched.value);

  private readonly _isValidating = signal(false);
  private readonly _isValidatingReadOnly = computed(
    () => this._isValidating.value,
  );

  private readonly _isDirty: ReadonlySignal<boolean> = computed(
    () => !isDeepEqual(this._defaultValue, unSignalifyValue(this.signal.value)),
  );

  private readonly _errorMap = signal<Partial<Record<ValidatorEvents, ValidationError>>>({});
  private readonly _errors = computed(() => {
    const errorMap = this._errorMap.value;
    return Object.values(errorMap).flat().filter(Boolean);
  });
  private readonly _isValid = computed(() => !this._errors.value.length);
  //endregion

  private readonly _validators: Record<
    ValidatorEvents,
    {
      sync: Array<ValidatorSync<ValueAtPath<TData, TName>> & WithKey>;
      async: Array<ValidatorAsync<ValueAtPath<TData, TName>> & WithKey>;
    }
  >;
  private readonly _asyncValidationState: Record<number, AbortController> = {};

  private _unsubscribeFromChangeEffect?: () => void;
  private _isMounted = false;

  constructor(
    private readonly _form: FormLogic<TData>,
    private readonly _name: TName,
    private readonly _options?: FieldLogicOptions<TData, TName>,
  ) {
    this._form.registerField(_name, this, _options?.defaultValue);

    if (_options?.defaultState?.isTouched) this._isTouched.value = true;
    if (_options?.defaultState?.errors) {
      this._errorMap.value = _options.defaultState.errors;
    }

    this._validators = groupValidators(this._options?.validators);
  }


  //region State
  public get isMounted() {
    return this._isMounted;
  }
  /**
   * The reactive signal of the field value, you can get, subscribe and set the value of the field with this signal.
   */
  public get signal() {
    return this._form.getValueForPath(this._name);
  }

  public get name() {
    return this._name;
  }

  public get isValidating() {
    return this._isValidatingReadOnly;
  }

  public get errors() {
    return this._errors;
  }

  public get isValid() {
    return this._isValid;
  }

  public get isTouched() {
    return this._isTouchedReadOnly;
  }

  public get isDirty() {
    return this._isDirty;
  }
  //endregion

  //region Lifecycle
  public async mount() {
    // Once mounted, we want to listen to all changes to the value
    this._unsubscribeFromChangeEffect?.()
    this._unsubscribeFromChangeEffect = effect(async () => {
      const currentValue = this.signal.value;

      // Clear all onSubmit errors when the value changes
      const { onSubmit: _, ...errors } = this._errorMap.peek();
      this._errorMap.value = errors;

      if (!this._isMounted) {
        return;
      }

      // The value has to be passed here so that the effect subscribes to it
      await this.validateForEvent("onChange", currentValue);
    })

    this._isMounted = true;
    await this.validateForEvent("onMount");
  }

  public unmount() {
    this._isTouched.value = false;
    this._isMounted = false;

    this._unsubscribeFromChangeEffect?.();

    this._form.unregisterField(
      this._name,
      this._options?.preserveValueOnUnmount,
    );
  }
  //endregion

  //region Handlers
  /**
   * Manually validate the field for a specific event. This will run all validators for the event and update the field state.
   * @param event The event to validate for
   * @param checkValue The value to validate, if not provided the current value of the field will be used
   */
  public validateForEvent(
    event: ValidatorEvents,
    checkValue?: SignalifiedData<ValueAtPath<TData, TName>>,
  ) {
    if(!this._isMounted && event !== "onSubmit") return;
    const value = unSignalifyValue(checkValue ?? this.signal);
    return validateWithValidators(value, event, this._validators, this._asyncValidationState, this._errorMap, this._isValidating, this._options?.accumulateErrors);
  }

  /**
   * Handle a change in the field value. You can also directly set the value of the field with `field.signal.value = newValue`.
   * This is just a convenience method to be passed as a method reference.
   * @param newValue The new value of the field
   * @param options Options for the change
   */
  public handleChange(
    newValue: ValueAtPath<TData, TName>,
    options?: { shouldTouch?: boolean },
  ) {
    if(!this._isMounted) return;
    batch(() => {
      this.signal.value = newValue;
      if (options?.shouldTouch) {
        this._isTouched.value = true;
      }
    });
  }

  /**
   * Handle a blur event on the field. This will set the field as touched and run all validators for the onBlur event.
   */
  public async handleBlur() {
    if(!this._isMounted) return;
    this._isTouched.value = true;
    await this.validateForEvent("onBlur");
    await this._form.handleBlur();
  }

  /**
   * Handle a submit event on the field. This will run all validators for the onSubmit event.
   */
  public async handleSubmit() {
    await this.validateForEvent("onSubmit");

    // If there are any errors, we don't want to submit the form
    if (!this.isValid.value) {
      return;
    }
    return this.signal.value;
  }

  public async handleTouched() {
    this._isTouched.value = true;
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
  public insertValueInArray<Index extends number>(
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
    this._form.insertValueInArray(this._name, index, value, options)
  }

  /**
   * Push a value to an array. If the field is not an array it will throw an error. You should also not push a value to a readonly array, this is also intended to give type errors.
   * @param value The value to push to the array
   * @param options Options for the push
   */
  public pushValueToArray(
    // biome-ignore lint/suspicious/noExplicitAny: Could be any array
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ) {
    this._form.pushValueToArray(this._name, value, options)
  }

  /**
   * Remove a value from an array. If the field is not an array it will throw an error. You should also not remove a value from a readonly array, this is also intended to give type errors.
   * Removing a value will shift the index of all its following values, the key for all the items will stay the same.
   * @param index The index of the value to remove
   * @param options Options for the remove
   */
  public removeValueFromArray(
    // biome-ignore lint/suspicious/noExplicitAny: Could be any array
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ) {
    this._form.removeValueFromArray(this._name, index, options)
  }

  /**
   * Swap two values in an array. If the field is not an array it will throw an error. You should also not swap values in a readonly array, this is also intended to give type errors.
   * @param indexA The index of the first value to swap
   * @param indexB The index of the second value to swap
   * @param options Options for the swap
   */
  public swapValuesInArray<IndexA extends number, IndexB extends number>(
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
    this._form.swapValuesInArray(this._name, indexA, indexB, options)
  }
  //endregion

  private get _defaultValue() {
    return (
      this._options?.defaultValue ??
      this._form.getDefaultValueForPath(this._name)
    );
  }
}

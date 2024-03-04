import {
  type ReadonlySignal,
  type Signal,
  batch,
  computed,
  effect,
  signal,
} from '@preact/signals-core'
import type { FormLogic } from './FormLogic'
import {
  type Paths,
  type SignalifiedData,
  type ValidationError,
  type ValidationErrorMap,
  type ValidatorAsync,
  type ValidatorEvents,
  type ValidatorSync,
  type ValueAtPath,
  deepSignalifyValue,
  equalityUtils,
  unSignalifyValue,
  unSignalifyValueSubscribed,
  validateWithValidators, clearSubmitEventErrors,
} from './utils'

export type FieldLogicOptions<TData, TName extends Paths<TData>> = {
  /**
   * Synchronous validator for the value of the field.
   */
  validator?: ValidatorSync<ValueAtPath<TData, TName>>
  /**
   * Async validator for the value of the field, this will be run after the sync validator if both are set.
   */
  validatorAsync?: ValidatorAsync<ValueAtPath<TData, TName>>
  /**
   * If true, all errors on validators will be accumulated and validation will not stop on the first error.
   * If there is a synchronous error, it will be displayed, no matter if the asnyc validator is still running.
   */
  accumulateErrors?: boolean
  /**
   * Whether this validator should run when a nested value changes
   * TODO Add tests
   */
  validateOnNestedChange?: boolean

  /**
   * Default value for the field
   */
  defaultValue?: ValueAtPath<TData, TName>

  /**
   * Initial state for the field
   */
  defaultState?: {
    isTouched?: boolean
    errors?: Partial<ValidationErrorMap>
  }

  /**
   * Whether the value should be preserved once the field is unmounted. <br/>
   * If true, this field will not run validations and not accept any changes to its value through its handlers. It, however, can still be submitted and will run validations on submit.
   * @note The signal value will not be locked when unmounted, so if you change the value directly through the signal, it will be updated in the form.
   */
  preserveValueOnUnmount?: boolean
}

// TODO Add async annotations so you only need to await if it is really needed
export class FieldLogic<TData, TName extends Paths<TData>> {
  //region Description
  private readonly _isTouched = signal(false)
  private readonly _isTouchedReadOnly = computed(() => this._isTouched.value)

  private readonly _isDirty: ReadonlySignal<boolean> = computed(
    () =>
      !equalityUtils(
        this.defaultValue,
        unSignalifyValueSubscribed(this.signal.value),
      ),
  )
  //endregion

  //region External Validation State
  private readonly _isValidating = signal(false)
  private readonly _isValidatingReadOnly = computed(
    () => this._isValidating.value,
  )

  private readonly _errorMap = signal<Partial<ValidationErrorMap>>({})
  private readonly _errors = computed(() => {
    const { sync, async } = this._errorMap.value
    return [sync, async] as const
  })
  private readonly _isValid = computed(
    () => !this._errors.value.filter(Boolean).length,
  )
  //endregion

  private readonly _previousAbortController: Signal<
    AbortController | undefined
  > = signal(undefined)
  private _unsubscribeFromChangeEffect?: () => void

  constructor(
    private readonly _form: FormLogic<TData>,
    private readonly _name: TName,
    private readonly _options?: FieldLogicOptions<TData, TName>,
  ) {
    this._form.registerField(_name, this, _options?.defaultValue)

    if (_options?.defaultState?.isTouched) this._isTouched.value = true
    if (_options?.defaultState?.errors) {
      this._errorMap.value = _options.defaultState.errors
    }
  }
  //endregion

  //region Internal State
  private _isMounted = false

  //region State
  public get isMounted(): boolean {
    return this._isMounted
  }
  /**
   * The reactive signal of the field value, you can get, subscribe and set the value of the field with this signal.
   */
  public get signal(): SignalifiedData<ValueAtPath<TData, TName>> {
    return this._form.getValueForPath(this._name)
  }

  public get name(): TName {
    return this._name
  }

  public get isValidating(): ReadonlySignal<boolean> {
    return this._isValidatingReadOnly
  }

  public get errors(): ReadonlySignal<readonly [ValidationError, ValidationError]> {
    return this._errors
  }

  public get isValid(): ReadonlySignal<boolean> {
    return this._isValid
  }

  public get isTouched(): ReadonlySignal<boolean> {
    return this._isTouchedReadOnly
  }

  public get isDirty(): ReadonlySignal<boolean> {
    return this._isDirty
  }
  //endregion

  public get defaultValue(): ValueAtPath<TData, TName> | undefined {
    return (
      this._options?.defaultValue ??
      this._form.getDefaultValueForPath(this._name)
    )
  }

  //region Lifecycle
  public async mount(): Promise<void> {
    if (this._isMounted) return
    // Once mounted, we want to listen to all changes to the value
    this._unsubscribeFromChangeEffect?.()
    const runOnChangeValidation = async (
      currentValue: ValueAtPath<TData, TName>,
    ) => {
      // Clear all onSubmit errors when the value changes
      clearSubmitEventErrors(this._errorMap)

      if (!this._isMounted) {
        return
      }

      // The value has to be passed here so that the effect subscribes to it
      await this.validateForEvent('onChange', currentValue)
    }
    if (this._options?.validateOnNestedChange) {
      this._unsubscribeFromChangeEffect = effect(async () => {
        const currentValue = unSignalifyValueSubscribed(this.signal)
        await runOnChangeValidation(currentValue)
      })
    } else {
      this._unsubscribeFromChangeEffect = effect(async () => {
        const currentValue = unSignalifyValue<ValueAtPath<TData, TName>>(this.signal.value)
        await runOnChangeValidation(currentValue)
      })
    }
    this._isMounted = true

    await this.validateForEvent('onMount')
  }
  //endregion

  public unmount(): void {
    if (!this._isMounted) return
    this._isTouched.value = false
    this._isMounted = false

    this._unsubscribeFromChangeEffect?.()

    this._form.unregisterField(
      this._name,
      this._options?.preserveValueOnUnmount,
    )
  }

  //region Handlers
  /**
   * Manually validate the field for a specific event. This will run all validators for the event and update the field state.
   * @param event The event to validate for
   * @param checkValue The value to validate, if not provided the current value of the field will be used
   */
  public validateForEvent(
    event: ValidatorEvents,
    checkValue?: ValueAtPath<TData, TName>,
  ): void | Promise<void> {
    if (!this._isMounted) return
    const value = checkValue ?? unSignalifyValue(this.signal)
    return validateWithValidators(
      value,
      event,
      this._options?.validator,
      this._options?.validatorAsync,
      this._previousAbortController,
      this._errorMap,
      this._isValidating,
      this._options?.accumulateErrors,
    )
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
  ): void {
    if (!this._isMounted) return
    batch(() => {
      this.signal.value = newValue
      if (options?.shouldTouch) {
        this._isTouched.value = true
      }
    })
  }

  /**
   * Handle a blur event on the field. This will set the field as touched and run all validators for the onBlur event.
   */
  public async handleBlur(): Promise<void> {
    if (!this._isMounted) return
    this._isTouched.value = true
    await this.validateForEvent('onBlur')
    await this._form.handleBlur()
  }

  /**
   * Handle a submit-event on the field. This will run all validators for the onSubmit event.
   */
  public async handleSubmit(): Promise<void> {
    await this.validateForEvent('onSubmit')

    // If there are any errors, we don't want to submit the form
    if (!this.isValid.value) {
      return
    }
    return this.signal.value
  }
  //endregion

  public handleTouched(): void {
    this._isTouched.value = true
  }

  //region Array Helpers
  /**
   * Insert a value into an array. If the field is not an array, it will throw an error. For readonly arrays you can only insert values at existing indexes with the correct types.
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
  ): void {
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
  ): void {
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
  ): void {
    this._form.removeValueFromArray(this._name, index, options)
  }
  //endregion

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
  ): void {
    this._form.swapValuesInArray(this._name, indexA, indexB, options)
  }

  public reset(): void {
    this._errorMap.value = {}
    this._isTouched.value = false
    this._isValidating.value = false

    this.signal.value = (
      deepSignalifyValue(this.defaultValue) as SignalifiedData<
        ValueAtPath<TData, TName>
      >
    ).peek()
  }
}

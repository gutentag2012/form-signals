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
  type ValidatorAdapter,
  type ValidatorAsync,
  type ValidatorAsyncOptions,
  type ValidatorEvents,
  type ValidatorOptions,
  type ValidatorSchemaType,
  type ValidatorSync,
  type ValueAtPath,
  deepSignalifyValue,
  getValueAtPath,
  isEqualDeep,
  pathToParts,
  setSignalValuesFromObject,
  unSignalifyValue,
  unSignalifyValueSubscribed,
} from './utils'
import { Truthy } from './utils/internal.utils'
import type {
  ConnectPath,
  KeepOptionalKeys,
  LastPath,
  ParentPath,
  ValueAtPathForTuple,
} from './utils/types'
import {
  clearSubmitEventErrors,
  getValidatorFromAdapter,
  validateWithValidators,
} from './utils/validation'

/**
 * Options for the field logic.
 *
 * @alias FieldLogicOptions
 *
 * @template TData - The type of the form data.
 * @template TName - The path to the field.
 * @template TBoundValue - The type of the value that the field is bound to.
 * @template TAdapter - The type of the validator adapter.
 */
export type FieldLogicOptions<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> = {
  /**
   * Adapter for the validator. This will be used to create the validator from the validator and validatorAsync options.
   */
  validatorAdapter?: TAdapter
  /**
   * Synchronous validator for the value of the field.
   */
  validator?: TAdapter extends undefined
    ? ValidatorSync<
        ValueAtPath<TData, TName>,
        ValueAtPathForTuple<TData, TMixin>
      >
    :
        | ValidatorSync<
            ValueAtPath<TData, TName>,
            ValueAtPathForTuple<TData, TMixin>
          >
        | ReturnType<
            ValidatorSchemaType<
              ValueAtPath<TData, TName>,
              ValueAtPathForTuple<TData, TMixin>
            >
          >
  /**
   * Options for the validator
   */
  validatorOptions?: ValidatorOptions
  /**
   * Async validator for the value of the field, this will be run after the sync validator if both are set.
   */
  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<
        ValueAtPath<TData, TName>,
        TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
      >
    :
        | ValidatorAsync<
            ValueAtPath<TData, TName>,
            TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
          >
        | ReturnType<
            ValidatorSchemaType<
              ValueAtPath<TData, TName>,
              ValueAtPathForTuple<TData, TMixin>
            >
          >
  /**
   * Options for the async validator
   */
  validatorAsyncOptions?: ValidatorAsyncOptions
  /**
   * Whether this validator should run when a nested value changes
   */
  validateOnNestedChange?: boolean
  /**
   * Add other values within the form that should trigger this fields validation when they change.
   * These values will also be passed to the validator as following arguments.
   */
  validateMixin?: TMixin

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
   * If true, this field will not run validations and not accept any changes to its value through its handlers. It, however, can still be submitted and will run validations on the submit-event.
   * @note The signal value will not be locked when unmounted, so if you change the value directly through the signal, it will be updated in the form.
   */
  preserveValueOnUnmount?: boolean
  /**
   * Whenever a field is unmounted, the value within the form is deleted if the value should not be preserved.
   * If true, the field value will set to its default value.
   */
  resetValueToDefaultOnUnmount?: boolean

  /**
   * This takes the value provided by the binding and transforms it to the value that should be set in the form.
   * @param value The value from the binding
   * @note This will only affect the {@link handleChangeBound} method and the {@link transformedData}, so changes directly to the {@link signal} will not be transformed.
   */
  transformFromBinding?: (value: TBoundValue) => ValueAtPath<TData, TName>
  /**
   * This takes the value from the form and transforms it to the value that should be set in the binding. This is used in the transformedData.
   * @param value The value from the form
   * @note This will only affect the {@link transformedData} and not the {@link signal}.
   */
  transformToBinding?: (value: ValueAtPath<TData, TName>) => TBoundValue
}

// TODO Add core method to get a subfield
/**
 * Logic for a field in the form.
 *
 * @template TData - The type of the form data.
 * @template TName - The path to the field.
 * @template TBoundValue - The type of the value that the field is bound to.
 * @template TAdapter - The type of the validator adapter.
 * @template TFormAdapter - The type of the forms validator adapter.
 */
export class FieldLogic<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
> {
  //region Utility State
  private _transformedData?: Signal<TBoundValue | undefined> & {
    get base(): SignalifiedData<ValueAtPath<TData, TName>>
  }

  private readonly _options: Signal<
    | FieldLogicOptions<
        TData,
        TName,
        TBoundValue,
        TAdapter extends undefined ? TFormAdapter : TAdapter,
        TMixin
      >
    | undefined
  >

  private readonly _previousAbortController: Signal<
    AbortController | undefined
  > = signal(undefined)

  private _unsubscribeFromChangeEffect?: () => void

  private skipValidation = false
  //endregion

  //region State
  private readonly _isMounted = signal(false)
  private readonly _isTouched = signal(false)
  private readonly _errorMap = signal<Partial<ValidationErrorMap>>({})
  private readonly _isValidating = signal(false)
  //endregion

  //region Computed State
  private readonly _defaultValue = computed(() => {
    const def = getValueAtPath<TData, TName>(
      this._form.defaultValues.value,
      this._name,
    )
    return def
  })
  private readonly _isDirty: ReadonlySignal<boolean> = computed(
    () =>
      !isEqualDeep(
        this._defaultValue.value,
        unSignalifyValueSubscribed(this.data),
      ),
  )
  private readonly _errors = computed(() => {
    const { sync, async } = this._errorMap.value
    return [sync, async].filter(Truthy)
  })
  private readonly _isValid = computed(
    () => !this._errors.value.filter(Truthy).length,
  )
  //endregion

  //region Readonly State
  private readonly _isMountedReadOnly = computed(() => this._isMounted.value)
  private readonly _isTouchedReadOnly = computed(() => this._isTouched.value)
  private readonly _isValidatingReadOnly = computed(
    () => this._isValidating.value,
  )
  //endregion

  /**
   * Creates a new field logic.
   *
   * @param _form - The form that the field is part of.
   * @param _name - The name of the field and the path to its value in the form.
   * @param options - Options for the field.
   *
   * @note
   * It is recommended to use the {@link FormLogic#getOrCreateField} method to create a new field.
   */
  constructor(
    private readonly _form: FormLogic<TData, TFormAdapter>,
    private readonly _name: TName,
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundValue,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >,
  ) {
    this._options = signal(options)
    this._form.registerField(_name, this, options?.defaultValue)

    this.setupDataSignals()
    this.updateOptions(options)
  }

  //region State Getters
  /**
   * The data signal for the field.
   *
   * @note
   * The signal is still owned by the form.
   * This signal can be used to set the value of the field.
   * However, it is recommended to use the {@link FieldLogic#handleChange} method.
   *
   * @returns The data signal for the field.
   */
  public get data(): SignalifiedData<ValueAtPath<TData, TName>> {
    return this._form.getValueForPath(this._name)
  }

  /**
   * The transformed data signal for the field.
   *
   * @note
   * The underlying signal is still {@link FieldLogic#data} so all changes to the transformed data will be reflected in the data signal.
   * This signal can be used to set the value of the field.
   * However, it is recommended to use the {@link FieldLogic#handleChangeBound} method.
   *
   * @returns The transformed data signal for the field.
   */
  public get transformedData(): Signal<TBoundValue> {
    return this._transformedData as Signal<TBoundValue>
  }

  /**
   * The form that the field is part of.
   */
  public get form(): FormLogic<TData, TFormAdapter> {
    return this._form
  }

  /**
   * The complete name path of the field.
   *
   * @example
   * ```ts
   * const field = form.getField('user.name')
   * field.name // "user.name"
   * ```
   */
  public get name(): TName {
    return this._name
  }

  /**
   * The current name part of the field.
   *
   * @example
   * ```ts
   * const field = form.getField('user.name')
   * field.currentNamePart // "name"
   * ```
   */
  public get currentNamePart(): LastPath<TName> {
    return pathToParts(this._name).pop() as LastPath<TName>
  }

  /**
   * The parent name part of the field.
   *
   * @example
   * ```ts
   * const field = form.getField('user.name')
   * field.parentNamePart // "user"
   * ```
   */
  public get getParentNamePart(): ParentPath<TName> {
    return pathToParts(this._name).slice(0, -1).join('.') as ParentPath<TName>
  }

  public get isMounted(): Signal<boolean> {
    return this._isMountedReadOnly
  }

  public get isValidating(): ReadonlySignal<boolean> {
    return this._isValidatingReadOnly
  }

  /**
   * An array of sync and async errors.
   */
  public get errors(): ReadonlySignal<Array<ValidationError>> {
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

  public get defaultValue(): ReadonlySignal<
    ValueAtPath<TData, TName> | undefined
  > {
    return this._defaultValue
  }

  public get options(): ReadonlySignal<
    | FieldLogicOptions<
        TData,
        TName,
        TBoundValue,
        TAdapter extends undefined ? TFormAdapter : TAdapter,
        TMixin
      >
    | undefined
  > {
    return this._options
  }
  //endregion

  //region Lifecycle
  /**
   * Updates the options for the field.
   *
   * @param options - The new options for the field.
   *
   * @note
   * If the default values are updated and the field is not dirty, the value will be updated to the new default value.
   */
  public updateOptions(
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundValue,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >,
  ): void {
    batch(() => {
      const isDirty = this._isDirty.peek()
      this._options.value = options

      if (options?.defaultState?.isTouched) {
        this._isTouched.value = true
      }
      // We should only set the errors, if they are set, the field is not yet touched or dirty, and the field is valid
      if (
        options?.defaultState?.errors &&
        !this._isTouched.peek() &&
        !this._isDirty.value &&
        this._isValid.peek()
      ) {
        this._errorMap.value = options.defaultState.errors
      }

      if (isDirty) return

      if (options && "defaultValue" in options) {
        setSignalValuesFromObject(this.data, options.defaultValue)
      }
    })
  }

  /**
   * Mounts the field.
   *
   * @returns A function to unmount the field.
   *
   * @note
   * If the field is not mounted, the value will not be updated by the handlers and the validation will not run.
   */
  public async mount(): Promise<() => void> {
    this.setupDataSignals()

    // Once mounted, we want to listen to all changes to the value
    this._unsubscribeFromChangeEffect?.()
    const runOnChangeValidation = async (
      currentValue: ValueAtPath<TData, TName>,
      mixins: ValueAtPathForTuple<TData, TMixin>,
    ) => {
      // Clear all onSubmit errors when the value changes
      clearSubmitEventErrors(this._errorMap)

      if (!this._isMounted.peek()) {
        return
      }

      // The value has to be passed here so that the effect subscribes to it
      await this.validateForEventInternal('onChange', currentValue, mixins)
    }
    if (this._options.peek()?.validateOnNestedChange) {
      this._unsubscribeFromChangeEffect = effect(async () => {
        const currentValue = unSignalifyValueSubscribed(this.data)
        const mixinValues =
          this._options
            .peek()
            ?.validateMixin?.map((mixin) =>
              unSignalifyValueSubscribed(this._form.getValueForPath(mixin)),
            ) ?? []
        await runOnChangeValidation(
          currentValue,
          mixinValues as ValueAtPathForTuple<TData, TMixin>,
        )
      })
    } else {
      this._unsubscribeFromChangeEffect = effect(async () => {
        const currentValue = unSignalifyValue<ValueAtPath<TData, TName>>(
          this.data.value,
        )
        const mixinValues =
          this._options
            .peek()
            ?.validateMixin?.map((mixin) =>
              unSignalifyValue(this._form.getValueForPath(mixin).value),
            ) ?? []
        await runOnChangeValidation(
          currentValue,
          mixinValues as ValueAtPathForTuple<TData, TMixin>,
        )
      })
    }
    this._isMounted.value = true

    await this.validateForEvent('onMount')

    return () => {
      this.unmount()
    }
  }

  /**
   * Unmounts the field.
   *
   * @note
   * If not otherwise configured in the options, the value is removed from the form when unmounted.
   */
  public unmount(): void {
    this._isMounted.value = false
    this._transformedData = undefined

    if (!this._options.peek()?.preserveValueOnUnmount) {
      this.resetState()
    }

    this._unsubscribeFromChangeEffect?.()

    this._form.unregisterField(
      this._name,
      this.defaultValue.peek(),
      this._options.peek()?.preserveValueOnUnmount,
      this._options.peek()?.resetValueToDefaultOnUnmount,
    )
  }

  /**
   * Adds errors to the field.
   *
   * @param errors - The errors to add.
   *
   * @note
   * Existing errors will be kept unless they are overwritten by the new errors.
   */
  public setErrors(errors: Partial<ValidationErrorMap>): void {
    this._errorMap.value = {
      ...this._errorMap.value,
      ...errors,
    }
  }
  //endregion

  //region Handlers
  /**
   * Handles a change in the field.
   *
   * @param newValue - The new value for the field.
   * @param options - Options for the change.
   *
   * @note
   * If the field is not mounted, the change will not be handled.
   */
  public handleChange(
    newValue: ValueAtPath<TData, TName>,
    options?: { shouldTouch?: boolean },
  ): void {
    if (!this._isMounted.peek()) return
    this._form.handleChange(this._name, newValue, options)
  }

  /**
   * Validates the field for a given event.
   *
   * @param event - The event to validate for.
   *
   * @returns A promise that resolves when the validation is done.
   *
   * @note
   * If the field is not mounted, the form is not mounted, or the data is not set, the validation will not run.
   */
  public validateForEvent(event: ValidatorEvents): void | Promise<void> {
    return this.validateForEventInternal(event)
  }

  /**
   * Handles a change in the field from a binding.
   *
   * @param newValue - The new value for the field.
   * @param options - Options for the change.
   *
   * @note
   * If the field is not mounted, the change will not be handled.
   * If the field does not have a {@link FieldLogicOptions#transformFromBinding} function, the change will not be handled.
   */
  public handleChangeBound(
    newValue: TBoundValue,
    options?: { shouldTouch?: boolean },
  ): void {
    const transform = this._options.peek()?.transformFromBinding
    if (!this._isMounted.peek() || !transform) return
    batch(() => {
      setSignalValuesFromObject(this.data, transform(newValue))
      if (options?.shouldTouch) {
        this._isTouched.value = true
      }
    })
  }

  public async handleBlur(): Promise<void> {
    if (!this._isMounted.peek()) return
    this.handleTouched()
    await this.validateForEvent('onBlur')
    await this._form.handleBlur()
  }

  public async handleSubmit(): Promise<void> {
    await this.validateForEvent('onSubmit')
  }

  public handleTouched(): void {
    this._isTouched.value = true
  }
  //endregion

  //region Object Helpers
  /**
   * Sets a value in a dynamic object.
   *
   * @param key - The key to set the value at.
   * @param value - The value to set.
   * @param options - Options for the change.
   *
   * @note
   * If the key already exists, it will be updated and keep the signal reference.
   */
  public setValueInObject<TKey extends Paths<ValueAtPath<TData, TName>>>(
    key: TKey,
    value: ValueAtPath<TData, ConnectPath<TName, TKey>>,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.setValueInObject(this._name, key, value, options)
  }

  /**
   * Removes a value in a dynamic object.
   *
   * @param key - The key to remove the value at.
   * @param options - Options for the change.
   */
  public removeValueInObject<TKey extends Paths<ValueAtPath<TData, TName>>>(
    key: KeepOptionalKeys<ValueAtPath<TData, TName>, TKey>,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.removeValueInObject(this._name, key, options)
  }
  //endregion

  //region Array Helpers
  /**
   * Inserts a value to a given index.
   *
   * @param index - The index to insert the value at.
   * @param value - The value to insert.
   * @param options - Options for the change.
   *
   * @note
   * If there is already a value at the given index, it will be updated and keep the signal reference.
   */
  public insertValueInArray<Index extends number>(
    index: Index,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[Index]
        : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.insertValueInArray(this._name, index, value, options)
  }

  /**
   * Pushes a value to the end of an array.
   *
   * @param value - The value to push.
   * @param options - Options for the change.
   */
  public pushValueToArray(
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.pushValueToArray(this._name, value, options)
  }

  /**
   * Pushes a value to an array at a given index.
   *
   * @param index - The index to push the value at.
   * @param value - The value to push.
   * @param options - Options for the change.
   *
   * @note
   * Values with an index >= the given index will be moved one index up without losing the signal reference.
   */
  public pushValueToArrayAtIndex(
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.pushValueToArrayAtIndex(this._name, index, value, options)
  }

  /**
   * Removes a value from an array at a given index.
   *
   * @param index - The index to remove the value at.
   * @param options - Options for the change.
   */
  public removeValueFromArray(
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.removeValueFromArray(this._name, index, options)
  }

  /**
   * Removes the field from the parent array.
   *
   * @param options - Options for the change.
   */
  public removeSelfFromArray(options?: { shouldTouch?: boolean }): void {
    this._form.removeValueFromArray(
      this.getParentNamePart,
      this.currentNamePart as never,
      options,
    )
  }

  /**
   * Swaps two values in an array.
   *
   * @param indexA - The index of the first value to swap.
   * @param indexB - The index of the second value to swap.
   * @param options - Options for the change.
   *
   * @note
   * The references to the signals will not be lost.
   */
  public swapValuesInArray<IndexA extends number, IndexB extends number>(
    indexA: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexA] extends ValueAtPath<
            TData,
            TName
          >[IndexB]
          ? number
          : never
        : never,
    indexB: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
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

  /**
   * Swaps the field with another value in the parent array.
   *
   * @param indexB - The index of the value to swap with.
   * @param options - Options for the change.
   */
  public swapSelfInArray<IndexB extends number>(
    indexB: ValueAtPath<TData, ParentPath<TName>> extends any[]
      ? number
      : ValueAtPath<TData, ParentPath<TName>> extends readonly any[]
        ? ValueAtPath<TData, ParentPath<TName>>[IndexB] extends ValueAtPath<
            TData,
            TName
          >
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.swapValuesInArray(
      this.getParentNamePart,
      this.currentNamePart as never,
      indexB as never,
      options,
    )
  }

  /**
   * Moves a value in an array to a new index.
   *
   * @param indexA - The index of the value to move.
   * @param indexB - The index to move the value to.
   * @param options - Options for the change.
   */
  public moveValueInArray<IndexA extends number, IndexB extends number>(
    indexA: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexA] extends ValueAtPath<
            TData,
            TName
          >[IndexB]
          ? number
          : never
        : never,
    indexB: ValueAtPath<TData, TName> extends any[]
      ? number
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[IndexB] extends ValueAtPath<
            TData,
            TName
          >[IndexA]
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.moveValueInArray(this._name, indexA, indexB, options)
  }

  /**
   * Moves the field in the parent array to a new index.
   *
   * @param indexB - The index to move the field to.
   * @param options - Options for the change.
   */
  public moveSelfInArray<IndexB extends number>(
    indexB: ValueAtPath<TData, ParentPath<TName>> extends any[]
      ? number
      : ValueAtPath<TData, ParentPath<TName>> extends readonly any[]
        ? ValueAtPath<TData, ParentPath<TName>>[IndexB] extends ValueAtPath<
            TData,
            TName
          >
          ? number
          : never
        : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.moveValueInArray(
      this.getParentNamePart,
      this.currentNamePart as never,
      indexB as never,
      options,
    )
  }
  //endregion

  //region Resets
  /**
   * Resets the state of the field.
   *
   * @note
   * Most of the state is derived, so the only state that is reset is the error map, the touched state, and the validating state.
   */
  public resetState(): void {
    batch(() => {
      this._errorMap.value = {}
      this._isTouched.value = false
      this._isValidating.value = false
    })
  }

  /**
   * Resets the value of the field to the default value.
   *
   * @note
   * No validation will be run when resetting the value.
   */
  public resetValue(): void {
    this.skipValidation = true
    setSignalValuesFromObject(this.data, this.defaultValue.peek())
    this.skipValidation = false
  }

  /**
   * Resets the field values and state.
   */
  public reset(): void {
    this.resetValue()
    this.resetState()
  }
  //endregion

  //region Setups
  private setupDataSignals() {
    this._form.initFieldSignal(this._name, this.defaultValue.peek())
    this.setupTransformedSignal()
  }

  private setupTransformedSignal() {
    const baseSignal = this.data

    // If the base signal is not changed, then we do not need to recreate the transformed signal
    if (this._transformedData?.base === baseSignal) {
      return
    }

    const options = this._options.peek()
    const wrappedSignal = computed(() => {
      if (!options?.transformToBinding) return undefined
      return options.transformToBinding(unSignalifyValueSubscribed(this.data))
    })

    this._transformedData = {
      get base() {
        return baseSignal
      },
      set value(newValue: TBoundValue) {
        if (!options?.transformFromBinding) return
        const transformedValue = options.transformFromBinding(newValue)
        baseSignal.value = deepSignalifyValue(transformedValue).value
      },
      get value() {
        return wrappedSignal.value as TBoundValue
      },
      peek: wrappedSignal.peek.bind(wrappedSignal),
      brand: wrappedSignal.brand,
      toJSON: wrappedSignal.toJSON.bind(wrappedSignal),
      valueOf: wrappedSignal.valueOf.bind(wrappedSignal),
      toString: wrappedSignal.toString.bind(wrappedSignal),
      subscribe: wrappedSignal.subscribe.bind(wrappedSignal),
    }
  }
  //endregion

  //region Internals
  private validateForEventInternal(
    event: ValidatorEvents,
    checkValue?: ValueAtPath<TData, TName>,
    mixins?: ValueAtPathForTuple<TData, TMixin>,
  ): void | Promise<void> {
    if (!this._isMounted.peek() || !this.data || this.skipValidation) return
    const value = checkValue ?? unSignalifyValue(this.data)
    const mixinValues =
      mixins ??
      this._options
        .peek()
        ?.validateMixin?.map((mixin) =>
          unSignalifyValueSubscribed(this._form.getValueForPath(mixin)),
        ) ??
      []

    const adapter =
      this._options.peek()?.validatorAdapter ??
      this.form.options.peek()?.validatorAdapter
    const syncValidator = getValidatorFromAdapter(
      adapter,
      this._options.peek()?.validator,
    )
    const asyncValidator = getValidatorFromAdapter(
      adapter,
      this._options.peek()?.validatorAsync,
      true,
    )

    return validateWithValidators(
      value,
      mixinValues as any,
      event,
      syncValidator,
      this._options.peek()?.validatorOptions,
      asyncValidator,
      this._options.peek()?.validatorAsyncOptions,
      this._previousAbortController,
      this._errorMap,
      this._isValidating,
      this._isTouched.peek(),
    )
  }
  //endregion
}

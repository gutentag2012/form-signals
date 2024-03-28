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
  type ConnectPath,
  type KeepOptionalKeys,
  type LastPath,
  type ParentPath,
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
  clearSubmitEventErrors,
  deepSignalifyValue,
  getValueAtPath,
  isEqualDeep,
  pathToParts,
  setSignalValuesFromObject,
  unSignalifyValue,
  unSignalifyValueSubscribed,
  validateWithValidators,
} from './utils'
import { Truthy } from './utils/internal.utils'

export type FieldLogicOptions<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> = {
  /**
   * Adapter for the validator. This will be used to create the validator from the validator and validatorAsync options.
   */
  validatorAdapter?: TAdapter
  /**
   * Synchronous validator for the value of the field.
   */
  validator?: TAdapter extends undefined
    ? ValidatorSync<ValueAtPath<TData, TName>>
    :
        | ValidatorSync<ValueAtPath<TData, TName>>
        | ReturnType<ValidatorSchemaType<ValueAtPath<TData, TName>>>
  /**
   * Options for the validator
   */
  validatorOptions?: ValidatorOptions
  /**
   * Async validator for the value of the field, this will be run after the sync validator if both are set.
   */
  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<ValueAtPath<TData, TName>>
    :
        | ValidatorAsync<ValueAtPath<TData, TName>>
        | ReturnType<ValidatorSchemaType<ValueAtPath<TData, TName>>>
  /**
   * Options for the async validator
   */
  validatorAsyncOptions?: ValidatorAsyncOptions
  /**
   * If true, all errors on validators will be accumulated and validation will not stop on the first error.
   * If there is a synchronous error, it will be displayed, no matter if the asnyc validator is still running.
   */
  accumulateErrors?: boolean
  /**
   * Whether this validator should run when a nested value changes
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

// TODO Add async annotations so you only need to await if it is really needed
export class FieldLogic<
  TData,
  TName extends Paths<TData>,
  TBoundValue = never,
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
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
        TAdapter extends undefined ? TFormAdapter : TAdapter
      >
    | undefined
  >

  private readonly _previousAbortController: Signal<
    AbortController | undefined
  > = signal(undefined)

  private _unsubscribeFromChangeEffect?: () => void
  //endregion

  //region State
  private readonly _isMounted = signal(false)
  private readonly _isTouched = signal(false)
  private readonly _errorMap = signal<Partial<ValidationErrorMap>>({})
  private readonly _isValidating = signal(false)
  //endregion

  //region Computed State
  private readonly _defaultValue = computed(() => {
    return (
      this._options.value?.defaultValue ??
      getValueAtPath<TData, TName>(
        this._form.options.value?.defaultValues,
        this._name,
      )
    )
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

  constructor(
    private readonly _form: FormLogic<TData, TFormAdapter>,
    private readonly _name: TName,
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundValue,
      TAdapter extends undefined ? TFormAdapter : TAdapter
    >,
  ) {
    this._options = signal(options)
    this._form.registerField(_name, this, options?.defaultValue)

    this.setupDataSignals()
    this.updateOptions(options)
  }

  //region State Getters
  public get data(): SignalifiedData<ValueAtPath<TData, TName>> {
    return this._form.getValueForPath(this._name)
  }

  public get transformedData(): Signal<TBoundValue> {
    return this._transformedData as Signal<TBoundValue>
  }

  public get form(): FormLogic<TData, TFormAdapter> {
    return this._form
  }

  public get name(): TName {
    return this._name
  }

  public get currentNamePart(): LastPath<TName> {
    return pathToParts(this._name).pop() as LastPath<TName>
  }

  public get getParentNamePart(): ParentPath<TName> {
    return pathToParts(this._name).slice(0, -1).join('.') as ParentPath<TName>
  }

  public get isMounted(): Signal<boolean> {
    return this._isMountedReadOnly
  }

  public get isValidating(): ReadonlySignal<boolean> {
    return this._isValidatingReadOnly
  }

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
  //endregion

  //region Lifecycle
  public updateOptions(
    options?: FieldLogicOptions<
      TData,
      TName,
      TBoundValue,
      TAdapter extends undefined ? TFormAdapter : TAdapter
    >,
  ): void {
    const isDirty = this._isDirty.peek()
    this._options.value = options

    if (options?.defaultState?.isTouched) {
      this._isTouched.value = true
    }
    // We should only set the errors, if the are set, the field is not already touched or dirty, and the field is valid
    if (
      options?.defaultState?.errors &&
      !this._isTouched.peek() &&
      !this._isDirty.value &&
      this._isValid.peek()
    ) {
      this._errorMap.value = options.defaultState.errors
    }

    if (isDirty) return

    if (options?.defaultValue !== undefined) {
      setSignalValuesFromObject(this.data, options.defaultValue)
    }
  }

  public async mount(): Promise<() => void> {
    this.setupDataSignals()

    // Once mounted, we want to listen to all changes to the value
    this._unsubscribeFromChangeEffect?.()
    const runOnChangeValidation = async (
      currentValue: ValueAtPath<TData, TName>,
    ) => {
      // Clear all onSubmit errors when the value changes
      clearSubmitEventErrors(this._errorMap)

      if (!this._isMounted.peek()) {
        return
      }

      // The value has to be passed here so that the effect subscribes to it
      await this.validateForEvent('onChange', currentValue)
    }
    if (this._options.peek()?.validateOnNestedChange) {
      this._unsubscribeFromChangeEffect = effect(async () => {
        const currentValue = unSignalifyValueSubscribed(this.data)
        await runOnChangeValidation(currentValue)
      })
    } else {
      this._unsubscribeFromChangeEffect = effect(async () => {
        const currentValue = unSignalifyValue<ValueAtPath<TData, TName>>(
          this.data.value,
        )
        await runOnChangeValidation(currentValue)
      })
    }
    this._isMounted.value = true

    await this.validateForEvent('onMount')

    return () => {
      this.unmount()
    }
  }

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
  //endregion

  //region Handlers
  public validateForEvent(
    event: ValidatorEvents,
    checkValue?: ValueAtPath<TData, TName>,
  ): void | Promise<void> {
    if (!this._isMounted.peek() || !this._form.isMounted.peek() || !this.data)
      return
    const value = checkValue ?? unSignalifyValue(this.data)

    const adapter =
      this._options.peek()?.validatorAdapter ??
      this.form.options.peek()?.validatorAdapter
    const passedSyncValidator = this._options.peek()?.validator
    const syncValidator =
      adapter &&
      passedSyncValidator &&
      typeof passedSyncValidator !== 'function'
        ? adapter.sync(passedSyncValidator)
        : passedSyncValidator

    const passedAsyncValidator = this._options.peek()?.validatorAsync
    const asyncValidator =
      adapter &&
      passedAsyncValidator &&
      typeof passedAsyncValidator !== 'function'
        ? adapter.async(passedAsyncValidator)
        : passedAsyncValidator

    if (syncValidator && typeof syncValidator !== 'function') {
      throw new Error('The sync validator must be a function')
    }
    if (asyncValidator && typeof asyncValidator !== 'function') {
      throw new Error('The async validator must be a function')
    }

    return validateWithValidators(
      value,
      event,
      syncValidator,
      this._options.peek()?.validatorOptions,
      asyncValidator,
      this._options.peek()?.validatorAsyncOptions,
      this._previousAbortController,
      this._errorMap,
      this._isValidating,
      this._options.peek()?.accumulateErrors,
      this._isTouched.peek(),
    )
  }

  public handleChange(
    newValue: ValueAtPath<TData, TName>,
    options?: { shouldTouch?: boolean },
  ): void {
    if (!this._isMounted.peek()) return
    this._form.handleChange(this._name, newValue, options)
  }

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
  public setValueInObject<TKey extends Paths<ValueAtPath<TData, TName>>>(
    key: TKey,
    value: ValueAtPath<TData, ConnectPath<TName, TKey>>,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.setValueInObject(this._name, key, value, options)
  }

  public removeValueInObject<TKey extends Paths<ValueAtPath<TData, TName>>>(
    key: KeepOptionalKeys<ValueAtPath<TData, TName>, TKey>,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.removeValueInObject(this._name, key, options)
  }
  //endregion

  //region Array Helpers
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

  public pushValueToArray(
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.pushValueToArray(this._name, value, options)
  }

  public pushValueToArrayAtIndex(
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.pushValueToArrayAtIndex(this._name, index, value, options)
  }

  public removeValueFromArray(
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ): void {
    this._form.removeValueFromArray(this._name, index, options)
  }

  public removeSelfFromArray(options?: { shouldTouch?: boolean }) {
    this._form.removeValueFromArray(
      this.getParentNamePart,
      this.currentNamePart as never,
      options,
    )
  }

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
  ) {
    this._form.swapValuesInArray(
      this.getParentNamePart,
      this.currentNamePart as never,
      indexB as never,
      options,
    )
  }

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
  public resetState(): void {
    batch(() => {
      this._errorMap.value = {}
      this._isTouched.value = false
      this._isValidating.value = false
    })
  }

  public resetValue(): void {
    batch(() => {
      this._isMounted.value = false
      setSignalValuesFromObject(this.data, this._defaultValue.peek())
    })
    this._isMounted.value = true
  }

  public reset(): void {
    batch(() => {
      this.resetState()
      this.resetValue()
    })
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
}
// TODO Add core method to get a subfield

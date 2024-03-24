import {
  type ReadonlySignal,
  type Signal,
  batch,
  computed,
  effect,
  signal,
} from '@preact/signals-core'
import { FieldLogic, type FieldLogicOptions } from './FieldLogic'
import {
  type Paths,
  type SignalifiedData,
  type ValidationError,
  type ValidationErrorMap,
  type ValidatorAsync,
  type ValidatorEvents,
  type ValidatorSync,
  type ValueAtPath,
  clearSubmitEventErrors,
  deepSignalifyValue,
  getLeftUnequalPaths,
  getSignalValueAtPath,
  getValueAtPath,
  isEqualDeep,
  makeArrayEntry,
  removeSignalValueAtPath,
  removeValueAtPath,
  setSignalValueAtPath,
  setSignalValuesFromObject,
  setValueAtPath,
  unSignalifyValue,
  unSignalifyValueSubscribed,
  validateWithValidators,
} from './utils'
import { Truthy } from './utils/internal.utils'

export type FormLogicOptions<TData> = {
  /**
   * Synchronous validator for the value of the field.
   */
  validator?: ValidatorSync<TData>
  /**
   * Async validator for the value of the field, this will be run after the sync validator if both are set.
   */
  validatorAsync?: ValidatorAsync<TData>
  /**
   * If true, all errors on validators will be accumulated and validation will not stop on the first error.
   * If there is a synchronous error, it will be displayed, no matter if the asnyc validator is still running.
   */
  accumulateErrors?: boolean

  /**
   * Default values for the form
   */
  defaultValues?: TData

  /**
   * Callback for when the form is submitted
   * @param data The data at the time of submission
   */
  onSubmit?: (data: TData) => void | Promise<void>
}

export class FormLogic<TData> {
  /**
   * Single source of truth for the form data
   * @private
   */
  private readonly _data: SignalifiedData<TData>
  private readonly _jsonData = computed(() =>
    unSignalifyValueSubscribed(this._data),
  )

  /**
   * Map of all the fields in the form
   * @private
   */
  private readonly _fields: Signal<
    Map<Paths<TData>, FieldLogic<TData, Paths<TData>, any>>
  > = signal(new Map())
  private readonly _fieldsArray = computed(() =>
    Array.from(this._fields.value.values()),
  )

  /**
   * Errors specific for the whole form
   * @private
   */
  private readonly _errorMap = signal<Partial<ValidationErrorMap>>({})
  /**
   * @NOTE on errors
   * Each validator can trigger its own errors and can override only its own errors
   * Each list of errors is stored with a key that is unique to the validator, therefore, only this validator can override it
   */
  private readonly _errors = computed(() => {
    const { sync, async } = this._errorMap.value
    return [sync, async].filter(Truthy)
  })
  private readonly _mountedFieldErrors = computed(() => {
    const mountedFields = this._fieldsArray.value.filter(
      (field) => field.isMounted.value,
    )
    return mountedFields.flatMap((field) => field.errors.value).filter(Truthy)
  })
  private readonly _unmountedFieldErrors = computed(() => {
    const unmountedFields = this._fieldsArray.value.filter(
      (field) => !field.isMounted.value,
    )
    return unmountedFields.flatMap((field) => field.errors.value).filter(Truthy)
  })
  private readonly _isValidForm = computed(
    () => !this._errors.value.filter(Boolean).length,
  )
  private readonly _isValidFields = computed(() =>
    this._fieldsArray.value.every((field) => field.isValid.value),
  )
  private readonly _isValid = computed(
    () => this._isValidForm.value && this._isValidFields.value,
  )

  private readonly _isTouched = computed(() =>
    this._fieldsArray.value.some((field) => field.isTouched.value),
  )
  private readonly _submitCountSuccessful = signal(0)
  private readonly _submitCountSuccessfulReadOnly = computed(
    () => this._submitCountSuccessful.value,
  )
  private readonly _submitCountUnsuccessful = signal(0)
  private readonly _submitCountUnsuccessfulReadOnly = computed(
    () => this._submitCountUnsuccessful.value,
  )
  private readonly _submitCount = computed(
    () =>
      this._submitCountSuccessful.value + this._submitCountUnsuccessful.value,
  )
  private readonly _isValidatingForm = signal(false)
  private readonly _isValidatingFormReadOnly = computed(
    () => this._isValidatingForm.value,
  )
  private readonly _isSubmitting = signal(false)
  private readonly _isSubmittingReadOnly = computed(
    () => this._isSubmitting.value,
  )
  private readonly _isSubmitted = computed(() => {
    return !this._isSubmitting.value && this._submitCount.value > 0
  })
  // This is used to determine if a form is currently registering a field, if so we want to skip the next change event, since we expect a default value there
  private _currentlyRegisteringFields = 0
  private readonly _previousAbortController: Signal<
    AbortController | undefined
  > = signal(undefined)
  private _unsubscribeFromChangeEffect?: () => void
  private readonly _options: Signal<FormLogicOptions<TData> | undefined>
  private readonly _isDirty = computed(() => {
    const defaultValues = (this._options.value?.defaultValues ?? {}) as TData
    // Get any possible default value overrides from the fields
    for (const field of this._fieldsArray.value) {
      setValueAtPath(defaultValues, field.name, field.defaultValue.value)
    }

    return !isEqualDeep(defaultValues, this._jsonData.value)
  })
  private readonly _dirtyFields = computed(() => {
    const defaultValues = (this._options.value?.defaultValues ?? {}) as TData
    // Get any possible default value overrides from the fields
    for (const field of this._fieldsArray.value) {
      setValueAtPath(defaultValues, field.name, field.defaultValue.value)
    }

    return getLeftUnequalPaths(defaultValues, this._jsonData.value)
  })

  constructor(options?: FormLogicOptions<TData>) {
    if (options?.defaultValues) {
      this._data = deepSignalifyValue(options.defaultValues)
    } else {
      this._data = signal({}) as SignalifiedData<TData>
    }

    this._options = signal(options)
    this.updateOptions(options)
  }

  private _isMounted = signal(false)
  private readonly _isMountedReadOnly = computed(() => this._isMounted.value)

  //region Getter
  public get isMounted(): ReadonlySignal<boolean> {
    return this._isMountedReadOnly
  }

  private _isValidatingFields = computed(() =>
    this._fieldsArray.value.some((field) => field.isValidating.value),
  )

  private readonly _isValidating = computed(
    () => this._isValidatingForm.value || this._isValidatingFields.value,
  )
  private readonly _canSubmit = computed(() => {
    return (
      !this._isSubmitting.value &&
      !this._isValidating.value &&
      this._isValid.value
    )
  })

  public get isValidatingFields(): ReadonlySignal<boolean> {
    return this._isValidatingFields
  }

  public get data(): SignalifiedData<TData> {
    // This is not really always the full data, but this way you get type safety
    return this._data
  }

  public get json(): ReadonlySignal<TData> {
    // This is not really always the full data, but this way you get type safety
    return this._jsonData
  }

  public get errors(): ReadonlySignal<Array<ValidationError>> {
    return this._errors
  }

  public get mountedFieldErrors(): ReadonlySignal<Array<ValidationError>> {
    return this._mountedFieldErrors
  }

  public get unmountedFieldErrors(): ReadonlySignal<Array<ValidationError>> {
    return this._unmountedFieldErrors
  }

  public get fields(): Signal<Array<FieldLogic<TData, Paths<TData>, any>>> {
    return this._fieldsArray
  }

  public get isValidForm(): ReadonlySignal<boolean> {
    return this._isValidForm
  }

  public get isValidFields(): ReadonlySignal<boolean> {
    return this._isValidFields
  }

  public get isValid(): ReadonlySignal<boolean> {
    return this._isValid
  }

  public get isTouched(): ReadonlySignal<boolean> {
    return this._isTouched
  }

  public get isDirty(): ReadonlySignal<boolean> {
    return this._isDirty
  }

  /**
   * The amount of times the form finished submission successfully
   */
  public get submitCountSuccessful(): ReadonlySignal<number> {
    return this._submitCountSuccessfulReadOnly
  }

  /**
   * The amount of times the form finished submission with either validation errors or a failing onSubmit function
   */
  public get submitCountUnsuccessful(): ReadonlySignal<number> {
    return this._submitCountUnsuccessfulReadOnly
  }

  /**
   * The amount of times the form finished submission, regardless of the outcome
   */
  public get submitCount(): ReadonlySignal<number> {
    return this._submitCount
  }

  public get isValidatingForm(): ReadonlySignal<boolean> {
    return this._isValidatingFormReadOnly
  }

  public get isValidating(): ReadonlySignal<boolean> {
    return this._isValidating
  }

  public get isSubmitting(): ReadonlySignal<boolean> {
    return this._isSubmittingReadOnly
  }

  public get isSubmitted(): ReadonlySignal<boolean> {
    return this._isSubmitted
  }

  public get canSubmit(): ReadonlySignal<boolean> {
    return this._canSubmit
  }
  //endregion

  public updateOptions(options?: FormLogicOptions<TData>): void {
    const dirtyFields = this._dirtyFields.peek()
    this._options.value = options

    if (!this._data) return

    if (!options?.defaultValues) {
      return
    }

    // We do not want to update dirty field values, since we do not want to reset the form, but just override the default values
    const newDefaultValues = { ...options.defaultValues }
    for (const dirtyField of dirtyFields) {
      removeValueAtPath(newDefaultValues, dirtyField as never)
    }
    setSignalValuesFromObject(this._data, newDefaultValues, true)
  }

  public validateForEvent(
    event: ValidatorEvents,
    checkValue?: TData,
  ): void | Promise<void> {
    if (!this._isMounted.peek() && event !== 'onSubmit') return

    const value = checkValue ?? unSignalifyValue(this.data)
    return validateWithValidators(
      value,
      event,
      this._options.peek()?.validator,
      this._options.peek()?.validatorAsync,
      this._previousAbortController,
      this._errorMap,
      this._isValidatingForm,
      this._options.peek()?.accumulateErrors,
    )
  }
  //endregion

  //region Functions
  public handleBlur = async (): Promise<void> => {
    if (!this._isMounted.peek()) return
    await this.validateForEvent('onBlur')
  }

  public handleSubmit = async (): Promise<void> => {
    if (!this._isMounted.peek() || !this.canSubmit.peek()) return

    // TODO Only await if the the validators are async
    const onFinished = (successful: boolean) => {
      batch(() => {
        if (successful) {
          this._submitCountSuccessful.value++
        } else {
          this._submitCountUnsuccessful.value++
        }
        this._isSubmitting.value = false
      })
    }

    this._isSubmitting.value = true

    await Promise.all(
      this._fieldsArray.peek().map((field) => field.handleBlur()),
    )
    await Promise.all([
      this.validateForEvent('onSubmit'),
      ...this._fieldsArray.peek().map((field) => field.handleSubmit()),
    ])

    if (!this._isValid.peek()) {
      onFinished(false)
      return
    }

    const currentJson = this._jsonData.peek()

    const currentOptions = this._options.peek()
    if (currentOptions?.onSubmit) {
      try {
        const res = Promise.resolve(currentOptions.onSubmit(currentJson))

        await res.then((res) => {
          onFinished(true)
          return res
        })
      } catch (e) {
        onFinished(false)
        throw e
      }
    } else {
      onFinished(true)
    }
  }
  //endregion

  //region Lifecycle
  public async mount(): Promise<() => void> {
    // Once mounted, we want to listen to all changes to the form
    this._unsubscribeFromChangeEffect?.()
    this._unsubscribeFromChangeEffect = effect(async () => {
      const currentJson = this._jsonData.value

      if (!this._isMounted.peek()) {
        return
      }

      if (this._currentlyRegisteringFields > 0) {
        this._currentlyRegisteringFields--
        return
      }
      // TODO Currently this also runs if a field is registered, since the value is set to undefined, unsure if this is the expected behaviour
      // Clear all onSubmit errors when the value changes
      clearSubmitEventErrors(this._errorMap)

      await this.validateForEvent('onChange', currentJson as TData)
    })

    this._isMounted.value = true
    await this.validateForEvent('onMount')

    return () => {
      this.unmount()
    }
  }

  public unmount(): void {
    this._isMounted.value = false

    this._unsubscribeFromChangeEffect?.()
  }
  //endregion

  //region Field helpers
  public getOrCreateField<TPath extends Paths<TData>, TBoundValue=never>(
    path: TPath,
    fieldOptions?: FieldLogicOptions<TData, TPath, TBoundValue>,
  ): FieldLogic<TData, TPath, TBoundValue> {
    const existingField = this._fields.peek().get(path) as
      | FieldLogic<TData, TPath, TBoundValue>
      | undefined

    if (existingField) {
      existingField.updateOptions(fieldOptions)
      return existingField as FieldLogic<TData, TPath, TBoundValue>
    }

    const field = new FieldLogic<TData, TPath, TBoundValue>(
      this,
      path,
      fieldOptions,
    )
    this.registerField(path, field, this.getDefaultValueForPath(path))
    return field
  }

  public registerField<TPath extends Paths<TData>, TBoundValue=never>(
    path: TPath,
    field: FieldLogic<TData, TPath, TBoundValue>,
    defaultValues?: ValueAtPath<TData, TPath>,
  ): void {
    // This might be the case if a field was unmounted and preserved its value, in that case we do not want to do anything
    if (this._fields.peek().has(path)) return

    this._currentlyRegisteringFields++

    const newMap = new Map(this._fields.peek())
    // TODO Fix type here
    newMap.set(path, field as any)
    this._fields.value = newMap

    if (defaultValues === undefined) return
    setSignalValueAtPath<TData, TPath>(this._data, path, defaultValues)
  }

  public unregisterField<TPath extends Paths<TData>>(
    path: TPath,
    defaultValue?: ValueAtPath<TData, TPath>,
    preserveValue?: boolean,
    resetToDefault?: boolean,
  ): void {
    if (preserveValue) return

    const newMap = new Map(this._fields.peek())
    newMap.delete(path)
    this._fields.value = newMap

    if (resetToDefault) {
      setSignalValueAtPath(this._data, path, defaultValue)
    } else {
      removeSignalValueAtPath(this._data, path)
    }
  }
  //endregion

  //region Value helpers
  private readonly _optionsReadOnly = computed(() => this._options.value)
  public get options(): ReadonlySignal<FormLogicOptions<TData> | undefined> {
    return this._optionsReadOnly
  }

  public getDefaultValueForPath<TPath extends Paths<TData>>(
    path: TPath,
  ): ValueAtPath<TData, TPath> | undefined {
    return getValueAtPath<TData, TPath>(
      this._options.peek()?.defaultValues,
      path,
    )
  }

  public getValueForPath<TPath extends Paths<TData>>(
    path: TPath,
  ): SignalifiedData<ValueAtPath<TData, TPath>> {
    // TODO Fix tests due to not setting signal to undefined if not exist
    // TODO Fix typing so that this can be undefined maybe
    return getSignalValueAtPath<TData, TPath>(
      this._data,
      path,
    ) as SignalifiedData<ValueAtPath<TData, TPath>>
  }

  // TODO Add tests
  public initFieldSignal<TPath extends Paths<TData>>(
    path: TPath,
    defaultValue?: ValueAtPath<TData, TPath>,
  ): void {
    if (this.getValueForPath(path)) return
    setSignalValueAtPath(this._data, path, defaultValue)
  }

  public getFieldForPath<TPath extends Paths<TData>, TBoundData>(
    path: TPath,
  ): FieldLogic<TData, TPath, TBoundData> {
    return this._fields.peek().get(path) as FieldLogic<TData, TPath, TBoundData>
  }

  public resetStateForm(): void {
    this._submitCountSuccessful.value = 0
    this._submitCountUnsuccessful.value = 0
    this._isValidatingForm.value = false
    this._isSubmitting.value = false
    this._errorMap.value = {}
  }

  public resetStateFields(): void {
    for (const field of this._fieldsArray.peek()) {
      field.resetState()
    }
  }

  public resetState(): void {
    this.resetStateForm()
    this.resetStateFields()
  }

  public resetValues(): void {
    this._isMounted.value = false
    setSignalValuesFromObject(this._data, this._options.peek()?.defaultValues)
    this._isMounted.value = true
  }

  // TODO Allow similar reset to RHF https://www.react-hook-form.com/api/useform/reset/
  public reset(): void {
    this.resetState()
    this.resetValues()
  }
  //endregion

  //region Array Helpers
  /**
   * Insert a value into an array. If the field is not an array it will throw an error. For readonly arrays you can only insert values at existing indexes with the correct types.
   * This method should not be used to update the value of an array item, use `field.signal.value[index].value = newValue` instead.
   * @param name The name of the field
   * @param index The index to insert the value at (if there already is a value at this index, it will be overwritten without triggering a reactive update of that value and the array item key will change)
   * @param value The value to insert
   * @param options Options for the insert
   */
  public insertValueInArray<TName extends Paths<TData>, Index extends number>(
    name: TName,
    index: Index,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : ValueAtPath<TData, TName> extends readonly any[]
        ? ValueAtPath<TData, TName>[Index]
        : never,
    options?: { shouldTouch?: boolean },
  ): void {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value
    if (!Array.isArray(currentValue)) {
      console.error(`Tried to insert a value into a non-array field at ${name}`)
      return
    }
    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<unknown>
    arrayCopy[index] = makeArrayEntry(value)
    batch(() => {
      signal.value = arrayCopy as typeof currentValue
      if (options?.shouldTouch) {
        this.getFieldForPath(name)?.handleTouched()
      }
    })
  }

  /**
   * Push a value to an array. If the field is not an array it will throw an error. You should also not push a value to a readonly array, this is also intended to give type errors.
   * @param name The name of the field
   * @param value The value to push to the array
   * @param options Options for the push
   */
  public pushValueToArray<TName extends Paths<TData>>(
    name: TName,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value
    if (!Array.isArray(currentValue)) {
      console.error(`Tried to push a value into a non-array field at ${name}`)
      return
    }

    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<unknown>
    arrayCopy.push(makeArrayEntry(value))
    batch(() => {
      signal.value = arrayCopy as typeof currentValue
      if (options?.shouldTouch) {
        this.getFieldForPath(name)?.handleTouched()
      }
    })
  }

  /**
   * Remove a value from an array. If the field is not an array it will throw an error. You should also not remove a value from a readonly array, this is also intended to give type errors.
   * Removing a value will shift the index of all its following values, the key for all the items will stay the same.
   * @param name The name of the field
   * @param index The index of the value to remove
   * @param options Options for the remove
   *
   * TODO Add a helper to remove a value from a signal array by key
   */
  public removeValueFromArray<TName extends Paths<TData>>(
    name: TName,
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    options?: { shouldTouch?: boolean },
  ): void {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value
    if (!Array.isArray(currentValue)) {
      console.error(
        `Tried to remove a value from a non-array field at path ${name}`,
      )
      return
    }
    if (currentValue.length <= index || index < 0) {
      console.error(
        `Tried to remove a value from an array at path ${name} at index ${index} that does not exist`,
      )
      return
    }

    batch(() => {
      signal.value = [...currentValue].filter(
        (_, i) => i !== index,
      ) as typeof currentValue
      if (options?.shouldTouch) {
        this.getFieldForPath(name)?.handleTouched()
      }
    })
  }

  /**
   * Swap two values in an array. If the field is not an array it will throw an error. You should also not swap values in a readonly array, this is also intended to give type errors.
   * @param name The name of the field
   * @param indexA The index of the first value to swap
   * @param indexB The index of the second value to swap
   * @param options Options for the swap
   */
  public swapValuesInArray<
    TName extends Paths<TData>,
    IndexA extends number,
    IndexB extends number,
  >(
    name: TName,
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
    const signal = this.getValueForPath(name)
    const currentValue = signal.value
    if (!Array.isArray(currentValue)) {
      console.error(`Tried to swap values in a non-array field at path ${name}`)
      return
    }
    if (
      currentValue.length <= indexA ||
      indexA < 0 ||
      currentValue.length <= indexB ||
      indexB < 0
    ) {
      console.error(
        `Tried to swap values in an array at path ${name} at index ${indexA} that does not exist`,
      )
      return
    }
    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<unknown>
    const temp = arrayCopy[indexA]
    arrayCopy[indexA] = arrayCopy[indexB]
    arrayCopy[indexB] = temp

    batch(() => {
      signal.value = arrayCopy as typeof currentValue
      if (options?.shouldTouch) {
        this.getFieldForPath(name)?.handleTouched()
      }
    })
  }
  //endregion
}

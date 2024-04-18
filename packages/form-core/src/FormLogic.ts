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
  type ValidatorAdapter,
  type ValidatorAsync,
  type ValidatorAsyncOptions,
  type ValidatorEvents,
  type ValidatorOptions,
  type ValidatorSchemaType,
  type ValidatorSync,
  type ValueAtPath,
  deepSignalifyValue,
  getLeftUnequalPaths,
  getSignalValueAtPath,
  getValueAtPath,
  isEqualDeep,
  makeArrayEntry,
  removeSignalValueAtPath,
  setSignalValueAtPath,
  setSignalValuesFromObject,
  setValueAtPath,
  unSignalifyValue,
  unSignalifyValueSubscribed,
} from './utils'
import { Truthy } from './utils/internal.utils'
import type { ConnectPath, KeepOptionalKeys } from './utils/types'
import {
  clearSubmitEventErrors,
  getValidatorFromAdapter,
  validateWithValidators,
} from './utils/validation'

/**
 * Options for the form logic.
 *
 * @template TData - The type of the data.
 * @template TAdapter - The type of the validator adapter.
 */
export type FormLogicOptions<
  TData,
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
    ? ValidatorSync<TData>
    : ValidatorSync<TData> | ReturnType<ValidatorSchemaType<TData, never[]>>
  /**
   * Options for the validator
   */
  validatorOptions?: ValidatorOptions
  /**
   * Async validator for the value of the field, this will be run after the sync validator if both are set.
   */
  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<TData>
    : ValidatorAsync<TData> | ReturnType<ValidatorSchemaType<TData, never[]>>
  /**
   * Options for the async validator
   */
  validatorAsyncOptions?: ValidatorAsyncOptions

  /**
   * Default values for the form
   */
  defaultValues?: TData

  /**
   * Callback for when the form is submitted
   * @param data The data at the time of submission
   * @param addErrors A function to add errors to the form
   */
  onSubmit?: (
    data: TData,
    addErrors: (errors: Partial<Record<Paths<TData>, ValidationError>>) => void,
  ) => void | Promise<void>
}

/**
 * Logic for a form.
 *
 * @template TData - The type of the data.
 * @template TAdapter - The type of the validator adapter.
 */
export class FormLogic<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> {
  //region Data
  private readonly _data: SignalifiedData<TData>
  private readonly _jsonData = computed(() =>
    unSignalifyValueSubscribed(this._data),
  )
  //endregion

  //region Utility State
  private readonly _options: Signal<
    FormLogicOptions<TData, TAdapter> | undefined
  >

  private readonly _previousAbortController: Signal<
    AbortController | undefined
  > = signal(undefined)

  private _unsubscribeFromChangeEffect?: () => void

  private _skipValidation = false
  //endregion

  //region Fields
  // This is used to determine if a form is currently registering a field, if so we want to skip the next change event, since we expect a default value there
  private _currentlyRegisteringFields = 0

  private readonly _fields: Signal<
    Map<Paths<TData>, FieldLogic<TData, Paths<TData>, any>>
  > = signal(new Map())
  private readonly _fieldsArray = computed(() => {
    const fields = Array.from(this._fields.value.values())
    // We are sorting this in the hierarchical order, so that parents are sorted before their children
    fields.sort((a, b) => (a.name as string).localeCompare(b.name))
    return fields
  })
  //endregion

  //region State
  private readonly _isMounted = signal(false)
  private readonly _submitCountSuccessful = signal(0)
  private readonly _submitCountUnsuccessful = signal(0)
  private readonly _isSubmitting = signal(false)
  private readonly _errorMap = signal<Partial<ValidationErrorMap>>({})
  private readonly _isValidatingForm = signal(false)
  //endregion

  //region Computed Error State
  private readonly _errors = computed(() => {
    const { sync, async, general } = this._errorMap.value
    return [sync, async, general].filter(Truthy)
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
  //endregion

  //region Computed Valid State
  private readonly _isValidatingFields = computed(() =>
    this._fieldsArray.value.some((field) => field.isValidating.value),
  )
  private readonly _isValidating = computed(
    () => this._isValidatingForm.value || this._isValidatingFields.value,
  )
  private readonly _isValidForm = computed(
    () => !this._errors.value.filter(Boolean).length,
  )
  private readonly _isValidFields = computed(() =>
    this._fieldsArray.value.every((field) => field.isValid.value),
  )
  private readonly _isValid = computed(
    () => this._isValidForm.value && this._isValidFields.value,
  )
  //endregion

  //region Computed State
  private readonly _combinedDefaultValues = computed(() => {
    const defaultValues = this._options.value?.defaultValues ?? ({} as TData)
    const fields = this._fieldsArray.value

    // Get any possible default value overrides from the fields
    for (const field of fields) {
      if (
        !field.isMounted.value &&
        !field.options.value?.preserveValueOnUnmount
      )
        continue
      const fieldOptions = field.options.value
      const currentDefaultValue = getValueAtPath(defaultValues, field.name)
      if(currentDefaultValue !== undefined) continue
      setValueAtPath(defaultValues, field.name, fieldOptions?.defaultValue)
    }

    return defaultValues
  })
  private readonly _isTouched = computed(() =>
    this._fieldsArray.value.some((field) => field.isTouched.value),
  )
  private readonly _submitCount = computed(
    () =>
      this._submitCountSuccessful.value + this._submitCountUnsuccessful.value,
  )
  private readonly _isSubmitted = computed(() => {
    return !this._isSubmitting.value && this._submitCount.value > 0
  })
  private readonly _isDirty = computed(
    () => !isEqualDeep(this._combinedDefaultValues.value, this._jsonData.value),
  )
  private readonly _dirtyFields = computed(
    () =>
      getLeftUnequalPaths(
        this._combinedDefaultValues.value,
        this._jsonData.value,
      ) as Paths<TData>[],
  )
  private readonly _canSubmit = computed(() => {
    return (
      !this._isSubmitting.value &&
      !this._isValidating.value &&
      this._isValid.value
    )
  })
  //endregion

  //region Readonly State
  private readonly _isMountedReadOnly = computed(() => this._isMounted.value)
  private readonly _optionsReadOnly = computed(() => this._options.value)
  private readonly _isValidatingFormReadOnly = computed(
    () => this._isValidatingForm.value,
  )
  private readonly _submitCountSuccessfulReadOnly = computed(
    () => this._submitCountSuccessful.value,
  )
  private readonly _submitCountUnsuccessfulReadOnly = computed(
    () => this._submitCountUnsuccessful.value,
  )
  private readonly _isSubmittingReadOnly = computed(
    () => this._isSubmitting.value,
  )
  //endregion

  constructor(options?: FormLogicOptions<TData, TAdapter>) {
    if (options?.defaultValues) {
      this._data = deepSignalifyValue(options.defaultValues)
    } else {
      this._data = signal({}) as SignalifiedData<TData>
    }

    this._options = signal(options)
    this.updateOptions(options)
  }

  //region State Getters
  /**
   * The data of the form.
   *
   * @note
   * This is a {@link SignalifiedData} version of the data, meaning that you can subscribe to changes in the data.
   */
  public get data(): SignalifiedData<TData> {
    // This is not really always the full data, but this way you get type safety
    return this._data
  }

  /**
   * The data of the form as a JSON object.
   *
   * @note
   * This is a readonly signal, meaning that you can subscribe to changes in the data.
   * Changes to any nested value will trigger an update to this signal.
   */
  public get json(): ReadonlySignal<TData> {
    return this._jsonData
  }

  public get isMounted(): ReadonlySignal<boolean> {
    return this._isMountedReadOnly
  }

  /**
   * An array of sync and async errors.
   */
  public get errors(): ReadonlySignal<Array<ValidationError>> {
    return this._errors
  }

  /**
   * An array of errors for fields that are currently mounted.
   */
  public get mountedFieldErrors(): ReadonlySignal<Array<ValidationError>> {
    return this._mountedFieldErrors
  }

  /**
   * An array of errors for fields that are currently unmounted.
   */
  public get unmountedFieldErrors(): ReadonlySignal<Array<ValidationError>> {
    return this._unmountedFieldErrors
  }

  /**
   * All fields that have been registered to the form, both mounted and unmounted (only if they have {@link FieldLogicOptions#preserveValueOnUnmount}).
   */
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

  public get dirtyFields(): ReadonlySignal<Paths<TData>[]> {
    return this._dirtyFields
  }

  public get submitCountSuccessful(): ReadonlySignal<number> {
    return this._submitCountSuccessfulReadOnly
  }

  public get submitCountUnsuccessful(): ReadonlySignal<number> {
    return this._submitCountUnsuccessfulReadOnly
  }

  public get submitCount(): ReadonlySignal<number> {
    return this._submitCount
  }

  public get isValidatingFields(): ReadonlySignal<boolean> {
    return this._isValidatingFields
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

  public get options(): ReadonlySignal<
    FormLogicOptions<TData, TAdapter> | undefined
  > {
    return this._optionsReadOnly
  }

  public get defaultValues(): ReadonlySignal<TData> {
    return this._combinedDefaultValues
  }

  public getValueForPath<TPath extends Paths<TData>>(
    path: TPath,
  ): SignalifiedData<ValueAtPath<TData, TPath>> {
    return getSignalValueAtPath<TData, TPath>(
      this._data,
      path,
    ) as SignalifiedData<ValueAtPath<TData, TPath>>
  }
  //endregion

  //region Lifecycle
  /**
   * Update the options for the form.
   *
   * @param options - The new options for the form.
   *
   * @note
   * When updating the default values, all values that are not dirty will be reset to the new default value.
   */
  public updateOptions(options?: FormLogicOptions<TData, TAdapter>): void {
    const dirtyFields = this._dirtyFields.peek()
    this._options.value = options

    if (!options?.defaultValues) {
      return
    }

    // We do not want to update dirty field values, since we do not want to reset the form, but just override the default values
    const newDefaultValues = { ...options.defaultValues }
    for (const dirtyField of dirtyFields) {
      setValueAtPath(newDefaultValues, dirtyField as never, getSignalValueAtPath(this.data, dirtyField).peek() as any)
    }
    setSignalValuesFromObject(this._data, newDefaultValues)
  }

  /**
   * Mount the form.
   *
   * @returns A function to unmount the form.
   */
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
      // Clear all onSubmit errors when the value changes
      clearSubmitEventErrors(this._errorMap)

      await this.validateForEventInternal('onChange', currentJson as TData)
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

  /**
   * Adds errors to the form.
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
   * Validate the form for a specific event.
   *
   * @param event - The event to validate for.
   *
   * @returns A promise that resolves when the validation is done.
   *
   * @note
   * If the form is not mounted, the validation will only be done for the {@link ValidatorEvents.onSubmit} event.
   */
  public validateForEvent(event: ValidatorEvents): void | Promise<void> {
    return this.validateForEventInternal(event)
  }

  /**
   * Handle the change to a nested value in the form.
   *
   * @param path - The path to the value to change.
   * @param newValue - The new value to set.
   * @param options - Options for the change.
   *
   * @note
   * If the form is unmounted, the change will not be applied.
   */
  public handleChange<TPath extends Paths<TData>>(
    path: TPath,
    newValue: ValueAtPath<TData, TPath>,
    options?: { shouldTouch?: boolean },
  ): void {
    if (!this._isMounted.peek()) return
    const field = this.getFieldForPath(path)
    batch(() => {
      setSignalValueAtPath(this._data, path, newValue)
      if (field && options?.shouldTouch) {
        field.handleTouched()
      }
    })
  }

  public async handleBlur(): Promise<void> {
    if (!this._isMounted.peek()) return
    await this.validateForEvent('onBlur')
  }

  public async handleSubmit(): Promise<void> {
    if (!this._isMounted.peek() || !this.canSubmit.peek()) return

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

    const currentOptions = this._options.peek()
    if (!currentOptions?.onSubmit) {
      onFinished(true)
      return
    }

    try {
      await currentOptions.onSubmit(this._jsonData.peek(), (errors) => {
        for (const [path, error] of Object.entries(errors)) {
          if (!path) {
            this.setErrors({
              async: error,
              asyncErrorEvent: 'server',
            })
            continue
          }

          const field = this.getFieldForPath(path as Paths<TData>)
          if (!field) {
            continue
          }
          field.setErrors({
            async: error,
            asyncErrorEvent: 'server',
          })
        }
      })
      onFinished(true)
    } catch (e) {
      onFinished(false)
      if (!(e instanceof Error)) {
        throw e
      }

      this._errorMap.value = {
        ...this._errorMap.peek(),
        general: e.message,
      }
    }
  }
  //endregion

  //region Field Helpers
  /**
   * Get or create a field for the form.
   *
   * @param path - The path to the field.
   * @param fieldOptions - Options for the field.
   *
   * @returns The field logic for the path.
   *
   * @note
   * If the field already exists, the options will be updated.
   */
  public getOrCreateField<
    TPath extends Paths<TData>,
    TBoundValue = never,
    TFieldAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TPath>[] = never[],
  >(
    path: TPath,
    fieldOptions?: FieldLogicOptions<
      TData,
      TPath,
      TBoundValue,
      TFieldAdapter extends undefined ? TAdapter : TFieldAdapter,
      TMixin
    >,
  ): FieldLogic<TData, TPath, TBoundValue, TFieldAdapter, TAdapter, TMixin> {
    const existingField = this._fields.peek().get(path) as
      | FieldLogic<TData, TPath, TBoundValue, TFieldAdapter, TAdapter, TMixin>
      | undefined

    if (existingField) {
      existingField.updateOptions(fieldOptions)
      return existingField as FieldLogic<
        TData,
        TPath,
        TBoundValue,
        TFieldAdapter,
        TAdapter,
        TMixin
      >
    }

    const field = new FieldLogic(this, path, fieldOptions)
    this.registerField(path, field, this.getDefaultValueForPath(path))
    return field
  }

  /**
   * Register a field to the form.
   *
   * @param path - The path to the field.
   * @param field - The field to register.
   * @param defaultValues - Default values for the field.
   *
   * @internal Do not call this method on your own since it is called during the construction of {@link FieldLogic}
   */
  public registerField<
    TPath extends Paths<TData>,
    TBoundValue = never,
    TFieldAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TPath>[] = [],
  >(
    path: TPath,
    field: FieldLogic<
      TData,
      TPath,
      TBoundValue,
      TFieldAdapter,
      TAdapter,
      TMixin
    >,
    defaultValues?: ValueAtPath<TData, TPath>,
  ): void {
    // This might be the case if a field was unmounted and preserved its value, in that case we do not want to do anything
    if (this._fields.peek().has(path)) return

    this._currentlyRegisteringFields++

    const newMap = new Map(this._fields.peek())
    newMap.set(path, field as any)
    this._fields.value = newMap

    if (defaultValues === undefined) return
    setSignalValueAtPath<TData, TPath>(this._data, path, defaultValues)
  }

  /**
   * Initialize a field signal.
   *
   * @param path - The path to the field.
   * @param defaultValue - The default value for the field.
   *
   * @internal Do not call this method on your own since it is called during the construction of {@link FieldLogic}
   */
  public initFieldSignal<TPath extends Paths<TData>>(
    path: TPath,
    defaultValue?: ValueAtPath<TData, TPath>,
  ): void {
    if (this.getValueForPath(path) !== undefined) return
    setSignalValueAtPath(this._data, path, defaultValue)
  }

  /**
   * Unregister a field from the form.
   *
   * @param path - The path to the field.
   * @param defaultValue - The default value for the field.
   * @param preserveValue - If true, the value will be preserved in the form data.
   * @param resetToDefault - If true, the value will be reset to the default value.
   *
   * @note
   * By default, the value of an unregistered Field will be removed from the form data.
   *
   * @internal Do not call this method on your own since it is called during the unmounting of {@link FieldLogic}
   */
  public unregisterField<TPath extends Paths<TData>>(
    path: TPath,
    defaultValue?: ValueAtPath<TData, TPath>,
    preserveValue?: boolean,
    resetToDefault?: boolean,
  ): void {
    if (preserveValue) return

    const newMap = new Map(this._fields.peek())
    newMap.delete(path)
    for (const key of newMap.keys()) {
      if(!(key as string).startsWith(`${path}.`)) continue
      newMap.delete(key)
    }
    this._fields.value = newMap

    if (resetToDefault) {
      setSignalValueAtPath(this._data, path, defaultValue)
    } else {
      removeSignalValueAtPath(this._data, path)
    }
  }

  public getDefaultValueForPath<TPath extends Paths<TData>>(
    path: TPath,
  ): ValueAtPath<TData, TPath> | undefined {
    return getValueAtPath<TData, TPath>(
      this._combinedDefaultValues.peek(),
      path,
    )
  }

  public getFieldForPath<
    TPath extends Paths<TData>,
    TBoundData = never,
    TFieldAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TPath>[] = never[],
  >(
    path: TPath,
  ): FieldLogic<TData, TPath, TBoundData, TFieldAdapter, TAdapter, TMixin> {
    return this._fields.peek().get(path) as FieldLogic<
      TData,
      TPath,
      TBoundData,
      TFieldAdapter,
      TAdapter,
      TMixin
    >
  }
  //endregion

  //region Object Helpers
  /**
   * Sets a value in a dynamic object.
   *
   * @param path - The path to the object.
   * @param key - The key to set the value at.
   * @param value - The value to set.
   * @param options - Options for the change.
   *
   * @note
   * If the key already exists, it will be updated and keep the signal reference.
   */
  public setValueInObject<
    TPath extends Paths<TData>,
    TKey extends Paths<ValueAtPath<TData, TPath>>,
  >(
    path: TPath,
    key: TKey,
    value: ValueAtPath<TData, ConnectPath<TPath, TKey>>,
    options?: { shouldTouch?: boolean },
  ): void {
    const signal = this.getValueForPath(path)
    const currentValue = signal.value
    if (typeof currentValue !== 'object' || currentValue instanceof Date) {
      console.error(
        `Tried to add a value to a non-object field at path ${path}`,
      )
      return
    }

    batch(() => {
      setSignalValuesFromObject(signal, {
        [key]: value,
      } as any)
      if (options?.shouldTouch) {
        this.getFieldForPath(path)?.handleTouched()
      }
    })
  }

  /**
   * Removes a value in a dynamic object.
   *
   * @param path - The path to the object.
   * @param key - The key to remove the value at.
   * @param options - Options for the change.
   */
  public removeValueInObject<
    TPath extends Paths<TData>,
    TKey extends Paths<ValueAtPath<TData, TPath>>,
  >(
    path: TPath,
    key: KeepOptionalKeys<ValueAtPath<TData, TPath>, TKey>,
    options?: { shouldTouch?: boolean },
  ): void {
    const signal = this.getValueForPath(path)
    const currentValue = signal.value
    if (typeof currentValue !== 'object' || currentValue instanceof Date) {
      console.error(
        `Tried to remove a value from a non-object field at path ${path}`,
      )
      return
    }

    const newMap = new Map(this._fields.peek())
    let changed = false
    for (const key of newMap.keys()) {
      if(!(key as string).startsWith((`${path}.`))) continue
      newMap.delete(key)
      changed = true
    }
    if(changed) {
      this._fields.value = newMap
    }

    batch(() => {
      removeSignalValueAtPath(signal, key)
      if (options?.shouldTouch) {
        this.getFieldForPath(path)?.handleTouched()
      }
    })
  }
  //endregion

  //region Array Helpers
  /**
   * Inserts a value to a given index.
   *
   * @param name - The path to the array.
   * @param index - The index to insert the value at.
   * @param value - The value to insert.
   * @param options - Options for the change.
   *
   * @note
   * If there is already a value at the given index, it will be updated and keep the signal reference.
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
   * Pushes a value to the end of an array.
   *
   * @param name - The path to the array.
   * @param value - The value to push.
   * @param options - Options for the change.
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
   * Pushes a value to an array at a given index.
   *
   * @param name - The path to the array.
   * @param index - The index to push the value at.
   * @param value - The value to push.
   * @param options - Options for the change.
   *
   * @note
   * Values with an index >= the given index will be moved one index up without losing the signal reference.
   */
  public pushValueToArrayAtIndex<TName extends Paths<TData>>(
    name: TName,
    index: ValueAtPath<TData, TName> extends any[] ? number : never,
    value: ValueAtPath<TData, TName> extends any[]
      ? ValueAtPath<TData, TName>[number]
      : never,
    options?: { shouldTouch?: boolean },
  ): void {
    const signal = this.getValueForPath(name)
    const currentValue = signal.value
    if (!Array.isArray(currentValue)) {
      console.error(
        `Tried to push a value into a non-array field at ${name} and index ${index}`,
      )
      return
    }

    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<unknown>
    arrayCopy.splice(index, 0, makeArrayEntry(value))
    batch(() => {
      signal.value = arrayCopy as typeof currentValue
      if (options?.shouldTouch) {
        this.getFieldForPath(name)?.handleTouched()
      }
    })
  }

  /**
   * Removes a value from an array at a given index.
   *
   * @param name - The path to the array.
   * @param index - The index to remove the value at.
   * @param options - Options for the change.
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

    const newMap = new Map(this._fields.peek())
    let changed = false
    for (const key of newMap.keys()) {
      if(!(key as string).startsWith((`${name}.`))) continue
      newMap.delete(key)
      changed = true
    }
    if(changed) {
      this._fields.value = newMap
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
   * Swaps two values in an array.
   *
   * @param name - The path to the array.
   * @param indexA - The index of the first value to swap.
   * @param indexB - The index of the second value to swap.
   * @param options - Options for the change.
   *
   * @note
   * The references to the signals will not be lost.
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

  /**
   * Moves a value in an array to a new index.
   *
   * @param name - The path to the array.
   * @param indexA - The index of the value to move.
   * @param indexB - The index to move the value to.
   * @param options - Options for the change.
   */
  public moveValueInArray<
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
      console.error(`Tried to move value in a non-array field at path ${name}`)
      return
    }
    if (
      currentValue.length <= indexA ||
      indexA < 0 ||
      currentValue.length <= indexB ||
      indexB < 0
    ) {
      console.error(
        `Tried to move value in an array at path ${name} at index ${indexA} that does not exist`,
      )
      return
    }
    const arrayCopy = [...currentValue] as ValueAtPath<TData, TName> &
      Array<unknown>
    const [elementToMove] = arrayCopy.splice(indexA, 1)
    arrayCopy.splice(indexB, 0, elementToMove)

    batch(() => {
      signal.value = arrayCopy as typeof currentValue
      if (options?.shouldTouch) {
        this.getFieldForPath(name)?.handleTouched()
      }
    })
  }
  //endregion

  //region Resets
  /**
   * Reset the state of the form.
   *
   * @note
   * Most of the state is derived,
   * so the only state that is reset is the submit-count, the validation state, the submitting state and the error map.
   */
  public resetStateForm(): void {
    this._submitCountSuccessful.value = 0
    this._submitCountUnsuccessful.value = 0
    this._isValidatingForm.value = false
    this._isSubmitting.value = false
    this._errorMap.value = {}
  }

  /**
   * This will reset the state of all fields in the form.
   */
  public resetStateFields(): void {
    for (const field of this._fieldsArray.peek()) {
      field.resetState()
    }
  }

  /**
   * This will reset the state of the form and all fields.
   */
  public resetState(): void {
    this.resetStateForm()
    this.resetStateFields()
  }

  /**
   * This will reset the values of all fields in the form.
   *
   * @note
   * No validation will be run when resetting the value.
   */
  public resetValues(): void {
    this._skipValidation = true
    // TODO Test, that this includes the field default values
    setSignalValuesFromObject(this._data, this._combinedDefaultValues.peek())
    this._skipValidation = false
  }

  /**
   * This will both the state and values of the form and all fields.
   */
  public reset(): void {
    this.resetValues()
    this.resetState()
  }
  //endregion

  //region Internal
  private validateForEventInternal(
    event: ValidatorEvents,
    checkValue?: TData,
  ): void | Promise<void> {
    if (this._skipValidation || (!this._isMounted.peek() && event !== 'onSubmit')) return

    const value = checkValue ?? unSignalifyValue(this.data)

    const adapter = this._options.peek()?.validatorAdapter
    const syncValidator = getValidatorFromAdapter<TData>(
      adapter,
      this._options.peek()?.validator,
    )
    const asyncValidator = getValidatorFromAdapter<TData>(
      adapter,
      this._options.peek()?.validatorAsync,
      true,
    )

    return validateWithValidators(
      value,
      [],
      event,
      syncValidator,
      this._options.peek()?.validatorOptions,
      asyncValidator,
      this._options.peek()?.validatorAsyncOptions,
      this._previousAbortController,
      this._errorMap,
      this._isValidatingForm,
      this._isTouched.peek(),
    )
  }
  //endregion
}

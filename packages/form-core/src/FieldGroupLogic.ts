import {
  type ReadonlySignal,
  type Signal,
  batch,
  computed,
  effect,
  signal,
} from '@preact/signals-core'
import type { FieldLogic } from './FieldLogic'
import type { FormLogic } from './FormLogic'
import {
  type Paths,
  type ValidationError,
  type ValidationErrorMap,
  type ValidatorAdapter,
  type ValidatorAsync,
  type ValidatorAsyncOptions,
  type ValidatorEvents,
  type ValidatorOptions,
  type ValidatorSchemaType,
  type ValidatorSync,
  getLeftUnequalPaths,
  getValueAtPath,
  isEqualDeep,
  setSignalValueAtPath,
  setValueAtPath,
  unSignalifyValue,
  unSignalifyValueSubscribed,
} from './utils'
import { Truthy } from './utils/internal.utils'
import type {
  ExcludeAll,
  PartialForPaths,
  ValueAtPathForTuple,
} from './utils/types'
import {
  clearSubmitEventErrors,
  getValidatorFromAdapter,
  validateWithValidators,
} from './utils/validation'

/**
 * The options for the field group logic.
 *
 * @template TData - The data type of the form.
 * @template TMembers - The paths of the fields in the group.
 * @template TAdapter - The adapter for the validators.
 * @template TMixin - The paths of the values that should be mixed into the validation.
 */
export type FieldGroupLogicOptions<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> = {
  /**
   * Whether the field group is disabled.
   */
  disabled?: boolean
  /**
   Adapter for the validator. This will be used to create the validator from the validator and validatorAsync options.
   @note Fields in this field group will inherit the adapter from the form if they have no own adapter.
   */
  validatorAdapter?: TAdapter
  /**
   * The synchronous validator for the field group.
   * It is either a function that returns a validation error or a schema for the provided adapter that can be used to validate the data.
   */
  validator?: TAdapter extends undefined
    ? ValidatorSync<
        PartialForPaths<TData, TMembers>,
        ValueAtPathForTuple<TData, TMixin>
      >
    :
        | ValidatorSync<
            PartialForPaths<TData, TMembers>,
            ValueAtPathForTuple<TData, TMixin>
          >
        | ReturnType<
            ValidatorSchemaType<
              PartialForPaths<TData, TMembers>,
              ValueAtPathForTuple<TData, TMixin>
            >
          >
  /**
   * The options for the synchronous validator.
   */
  validatorOptions?: ValidatorOptions
  /**
   * The asynchronous validator for the field group.
   * It is either a function that returns a validation error or a schema for the provided adapter that can be used to validate the data.
   */
  validatorAsync?: TAdapter extends undefined
    ? ValidatorAsync<
        PartialForPaths<TData, TMembers>,
        TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
      >
    :
        | ValidatorAsync<
            PartialForPaths<TData, TMembers>,
            TMixin extends never ? never : ValueAtPathForTuple<TData, TMixin>
          >
        | ReturnType<
            ValidatorSchemaType<
              PartialForPaths<TData, TMembers>,
              ValueAtPathForTuple<TData, TMixin>
            >
          >
  /**
   * The options for the asynchronous validator.
   */
  validatorAsyncOptions?: ValidatorAsyncOptions
  /**
   * The paths of the values that should be mixed into the validation.
   */
  validateMixin?: TMixin

  /**
   * The function that is called when the group is submitted.
   *
   * @param data - The data of the group.
   * @param addErrors - A function to add errors to the group.
   */
  onSubmit?: (
    data: PartialForPaths<TData, TMembers>,
    addErrors: (
      errors: Partial<Record<Paths<TData>, ValidationError>> | ValidationError,
    ) => void,
  ) => void | Promise<void>
}

/**
 * The logic for a group of fields in a form.
 * This acts as a a field in a way that it does not own any data, but has other functionalities of a form, such as validation and submission.
 *
 * @template TData - The data type of the form.
 * @template TMembers - The paths of the fields in the group.
 * @template TAdapter - The adapter for the validators.
 * @template TFormAdapter - The adapter for the form.
 * @template TMixin - The paths of the values that should be mixed into the validation.
 */
export class FieldGroupLogic<
  TData,
  TMembers extends Paths<TData>[],
  TAdapter extends ValidatorAdapter | undefined = undefined,
  TFormAdapter extends ValidatorAdapter | undefined = undefined,
  TMixin extends readonly ExcludeAll<Paths<TData>, TMembers>[] = never[],
> {
  //region Utility State
  private readonly _options: Signal<
    | FieldGroupLogicOptions<
        TData,
        TMembers,
        TAdapter extends undefined ? TFormAdapter : TAdapter,
        TMixin
      >
    | undefined
  >

  private _skipValidation = false
  //endregion

  //region Data
  private readonly _groupData = computed(() => {
    const data = {}
    for (const field of this._members) {
      // This has to subscribe to all values since it might be possible, that the groups field is not initialized yet
      const signalValue = unSignalifyValueSubscribed(this._form.data)
      setValueAtPath(
        data,
        field as never,
        getValueAtPath(signalValue, field as never),
      )
    }
    return data as PartialForPaths<TData, TMembers>
  })
  private readonly _previousAbortController: Signal<
    AbortController | undefined
  > = signal(undefined)

  private _unsubscribeFromChangeEffect?: () => void
  //endregion

  //region State
  private readonly _isMounted = signal(false)
  private readonly _submitCountSuccessful = signal(0)
  private readonly _submitCountUnsuccessful = signal(0)
  private readonly _isSubmitting = signal(false)
  private readonly _errorMap = signal<Partial<ValidationErrorMap>>({})
  private readonly _disabled = signal(false)
  private readonly _isValidatingFieldGroup = signal(false)
  //endregion

  //region Computed State
  private readonly _fields = computed(() =>
    this._form.fields.value.filter((field) =>
      this._members.includes(field.name),
    ),
  )

  private readonly _defaultValues = computed(() => {
    const defaultValues = {}
    for (const field of this._members) {
      const defaultValue = getValueAtPath(this._form.defaultValues.value, field)
      setValueAtPath(defaultValues, field as never, defaultValue as never)
    }
    return defaultValues as PartialForPaths<TData, TMembers>
  })
  private readonly _isTouched = computed(() =>
    this._fields.value.some((field) => field.isTouched.value),
  )
  // In this case we cannot simply check `this._dirtyField.value.length > 0` since not all fields in the form might be registered, so this could only check registered fields
  private readonly _isDirty = computed(
    () => !isEqualDeep(this._defaultValues.value, this.data.value),
  )
  private readonly _dirtyFields = computed(
    () =>
      getLeftUnequalPaths(
        this.data.value,
        this._defaultValues.value,
      ) as unknown as Partial<TMembers>[],
  )
  private readonly _submitCount = computed(
    () =>
      this._submitCountSuccessful.value + this._submitCountUnsuccessful.value,
  )
  private readonly _isSubmitted = computed(() => {
    return !this._isSubmitting.value && this._submitCount.value > 0
  })
  private readonly _errors = computed(() => {
    const { sync, async, general } = this._errorMap.value
    return [sync, async, general].filter(Truthy)
  })
  private readonly _isValidatingFields = computed(() =>
    this._fields.value.some((field) => field.isValidating.value),
  )
  private readonly _isValidating = computed(
    () => this._isValidatingFieldGroup.value || this._isValidatingFields.value,
  )
  private readonly _isValidFieldGroup = computed(
    () => !this._errors.value.filter(Boolean).length,
  )
  private readonly _isValidFields = computed(() =>
    this._fields.value.every((field) => field.isValid.value),
  )
  private readonly _isValid = computed(
    () => this._isValidFieldGroup.value && this._isValidFields.value,
  )
  private readonly _canSubmit = computed(() => {
    return (
      !this._isSubmitting.value &&
      !this._isValidating.value &&
      this._isValid.value &&
      !this._disabled.value
    )
  })
  //endregion

  //region Readonly State
  private readonly _isMountedReadOnly = computed(() => this._isMounted.value)
  private readonly _isValidatingFieldGroupReadOnly = computed(
    () => this._isValidatingFieldGroup.value,
  )
  private readonly _optionsReadOnly = computed(() => this._options.value)
  private readonly _submitCountSuccessfulReadOnly = computed(
    () => this._submitCountSuccessful.value,
  )
  private readonly _submitCountUnsuccessfulReadOnly = computed(
    () => this._submitCountUnsuccessful.value,
  )
  private readonly _isSubmittingReadOnly = computed(
    () => this._isSubmitting.value,
  )
  private readonly _disabledReadOnly = computed(() => this._disabled.value)
  //endregion

  constructor(
    private readonly _form: FormLogic<TData, TFormAdapter>,
    private readonly _members: TMembers,
    options?: FieldGroupLogicOptions<
      TData,
      TMembers,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >,
  ) {
    this._options = signal(options)
    this._form.registerFieldGroup(this._members, this)

    this.updateOptions(options)
  }

  //region State Getters
  /**
   * The combined data of all fields in the group.
   * @note Due to technical limitations, this signal updates whenever ANY of the fields in the form are updated.
   */
  public get data(): ReadonlySignal<PartialForPaths<TData, TMembers>> {
    return this._groupData
  }

  public get form(): FormLogic<TData, TFormAdapter> {
    return this._form
  }

  public get members(): TMembers {
    return this._members
  }

  public get fields(): ReadonlySignal<
    Array<FieldLogic<TData, TMembers[number], any>>
  > {
    return this._fields
  }

  public get isValidatingFields(): ReadonlySignal<boolean> {
    return this._isValidatingFields
  }

  public get isValidatingFieldGroup(): ReadonlySignal<boolean> {
    return this._isValidatingFieldGroupReadOnly
  }

  public get isValidating(): ReadonlySignal<boolean> {
    return this._isValidating
  }

  public get errors(): ReadonlySignal<Array<ValidationError>> {
    return this._errors
  }

  public get isMounted(): ReadonlySignal<boolean> {
    return this._isMountedReadOnly
  }

  public get isValidFieldGroup(): ReadonlySignal<boolean> {
    return this._isValidFieldGroup
  }

  public get isValidFields(): ReadonlySignal<boolean> {
    return this._isValidFields
  }

  public get isValid(): ReadonlySignal<boolean> {
    return this._isValid
  }

  public get isDirty(): ReadonlySignal<boolean> {
    return this._isDirty
  }

  /**
   * Returns an array of paths that are unequal to the default values.
   * That also includes paths that are not registered as fields.
   * @note If a path is removed from the values but is present in the default values, it will NOT be included in this list.
   */
  public get dirtyFields(): ReadonlySignal<Partial<TMembers>[]> {
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

  public get isSubmitting(): ReadonlySignal<boolean> {
    return this._isSubmittingReadOnly
  }

  public get isSubmitted(): ReadonlySignal<boolean> {
    return this._isSubmitted
  }

  public get canSubmit(): ReadonlySignal<boolean> {
    return this._canSubmit
  }

  public get disabled(): ReadonlySignal<boolean> {
    return this._disabledReadOnly
  }

  public get options(): ReadonlySignal<
    | FieldGroupLogicOptions<
        TData,
        TMembers,
        TAdapter extends undefined ? TFormAdapter : TAdapter,
        TMixin
      >
    | undefined
  > {
    return this._optionsReadOnly
  }
  //endregion

  //region Lifecycle
  public updateOptions(
    options?: FieldGroupLogicOptions<
      TData,
      TMembers,
      TAdapter extends undefined ? TFormAdapter : TAdapter,
      TMixin
    >,
  ): void {
    this._options.value = options

    if (options && 'disabled' in options) {
      this._disabled.value = !!options.disabled
    }
  }

  /**
   * Mounts the field group.
   *
   * @returns A function to unmount the field group.
   *
   * @note
   * If the field group is not mounted the validation will not run.
   */
  public async mount(): Promise<() => void> {
    // Once mounted, we want to listen to all changes to the value
    this._unsubscribeFromChangeEffect?.()
    const runOnChangeValidation = async (
      currentValue: PartialForPaths<TData, TMembers>,
      mixins: ValueAtPathForTuple<TData, TMixin>,
    ) => {
      // Clear all onSubmit errors when the value changes
      clearSubmitEventErrors(this._errorMap)

      if (!this._isMounted.peek()) {
        return
      }

      // The value has to be passed here so that the effect subscribes to it
      await this.validateForEventInternal(
        'onChange',
        false,
        currentValue,
        mixins,
      )
    }
    this._unsubscribeFromChangeEffect = effect(async () => {
      const mixinValues =
        this._options
          .peek()
          ?.validateMixin?.map((mixin) =>
            unSignalifyValue(this._form.getValueForPath(mixin).value),
          ) ?? []
      await runOnChangeValidation(
        this.data.value,
        mixinValues as ValueAtPathForTuple<TData, TMixin>,
      )
    })
    this._isMounted.value = true

    await this.validateForEvent('onMount')

    return () => {
      this.unmount()
    }
  }

  /**
   * Unmounts the field group.
   */
  public unmount(): void {
    this._isMounted.value = false

    this._unsubscribeFromChangeEffect?.()

    this._form.unregisterFieldGroup(this._members)
  }

  /**
   * Adds errors to the field group.
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

  public disable(): void {
    this._disabled.value = true
  }

  public enable(): void {
    this._disabled.value = false
  }
  //endregion

  //region Handlers
  /**
   * Validates the field group for a given event.
   *
   * @param event - The event to validate for.
   * @param validateIfUnmounted - Whether to validate even if the field group is not mounted.
   *
   * @returns A promise that resolves when the validation is done.
   *
   * @note
   * If the field group is not mounted, the form is not mounted, or the data is not set, the validation will not run.
   */
  public validateForEvent(
    event: ValidatorEvents,
    validateIfUnmounted?: boolean,
  ): void | Promise<void> {
    return this.validateForEventInternal(event, validateIfUnmounted)
  }

  /**
   * Submits the field group and runs the validation.
   * Fields within the group will also run the onSubmit validation.
   * If the validation passes, the onSubmit function will be called.
   */
  public async handleSubmit(): Promise<void> {
    if (
      !this._isMounted.peek() ||
      !this.canSubmit.peek() ||
      this._disabled.peek()
    )
      return

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

    await Promise.all(this._fields.peek().map((field) => field.handleBlur()))
    await Promise.all([
      this.validateForEvent('onSubmit'),
      ...this._fields.peek().map((field) => field.validateForEvent('onSubmit')),
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
      await currentOptions.onSubmit(this.data.peek(), (errors) => {
        if (typeof errors === 'string') {
          this.setErrors({
            async: errors,
            asyncErrorEvent: 'server',
          })
          return
        }
        for (const [path, error] of Object.entries(errors as object)) {
          if (!path) {
            this.setErrors({
              async: error,
              asyncErrorEvent: 'server',
            })
            continue
          }

          const field = this.form.getFieldForPath(path as Paths<TData>)
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

  //region Resets
  /**
   * Reset the state of the field group.
   *
   * @note
   * Most of the state is derived,
   * so the only state that is reset is the submit-count, the validation state, the submitting state and the error map.
   */
  public resetStateFieldGroup(): void {
    this._submitCountSuccessful.value = 0
    this._submitCountUnsuccessful.value = 0
    this._isValidatingFieldGroup.value = false
    this._isSubmitting.value = false
    this._errorMap.value = {}
  }

  /**
   * This will reset the state of all fields in the field group.
   */
  public resetStateFields(): void {
    for (const field of this._fields.peek()) {
      field.resetState()
    }
  }

  /**
   * This will reset the state of the field group and all its fields.
   */
  public resetState(): void {
    this.resetStateFieldGroup()
    this.resetStateFields()
  }

  /**
   * This will reset the values of all fields in the field group.
   *
   * @note
   * No validation will be run when resetting the value.
   */
  public resetValues(): void {
    this._skipValidation = true
    for (const member of this._members) {
      const defaultValue = this._form.getDefaultValueForPath(member)
      setSignalValueAtPath(this._form.data, member, defaultValue)
    }
    this._skipValidation = false
  }

  /**
   * This will both the state and values of the field group and all fields.
   */
  public reset(): void {
    this.resetValues()
    this.resetState()
  }
  //endregion

  //region Internals
  private validateForEventInternal(
    event: ValidatorEvents,
    validateIfUnmounted?: boolean,
    checkValue?: PartialForPaths<TData, TMembers>,
    mixins?: ValueAtPathForTuple<TData, TMixin>,
  ): void | Promise<void> {
    if (      this._skipValidation ||
      this._form.skipValidation ||
      (!this._isMounted.peek() && event !== 'onSubmit' && !validateIfUnmounted) ||
      this._disabled.peek()
    ) {
      return
    }

    const value = checkValue ?? this.data.peek()
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
      this._isValidatingFieldGroup,
      this._isTouched.peek(),
    )
  }
  //endregion
}

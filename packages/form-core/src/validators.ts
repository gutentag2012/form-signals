import {batch, Signal} from "@preact/signals";
import {Truthy} from "./utils";

//region Types
interface ValidatorBase {
  /**
   * Whether the validator should run on change
   * @default false
   */
  onChange?: boolean;
  /**
   * Whether the validator should run on blur
   * @default false
   */
  onBlur?: boolean;
  /**
   * Whether the validator should run on submit
   * @default true
   */
  onSubmit?: boolean;
  /**
   * TODO Think of a way to reset errors made by this validation
   * Whether the validator should run on mount (this cannot be overwritten by other validations)
   * @default false
   */
  onMount?: boolean;
}

export type ValidatorEvents = keyof ValidatorBase;
export type ValidationError = string | undefined | null | false;
export type WithKey = { key: number };

export interface ValidatorSync<TValue> extends ValidatorBase {
  isAsync?: false;
  validate: (value: TValue) => ValidationError;
}

export interface ValidatorAsync<TValue> extends ValidatorBase {
  isAsync: true;
  validate: (
    value: TValue,
    abortSignal: AbortSignal,
  ) => Promise<ValidationError>;
  debounceMs?: number;
}
export type Validator<TValue> = ValidatorSync<TValue> | ValidatorAsync<TValue>;
//endregion

let ValidatorKeys = 0;

/**
 * Groups validators by their events for easier access
 * @param validators Array of validators to group
 * @returns Validators grouped by their events and whether they are async or not
 */
export const groupValidators = <TValue>(validators?: Validator<TValue>[]) => {
  const groupedValidators: Record<
    ValidatorEvents,
    {
      sync: Array<ValidatorSync<TValue> & WithKey>;
      async: Array<ValidatorAsync<TValue> & WithKey>;
    }
  > = {
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

  if (!validators) return groupedValidators;

  for (const validator of validators) {
    const events = [
      validator.onChange && ("onChange" as const),
      validator.onBlur && ("onBlur" as const),
      (validator.onSubmit ?? true) && ("onSubmit" as const),
      validator.onMount && ("onMount" as const),
    ].filter(Truthy);

    const validatorWithKey = { ...validator, key: ValidatorKeys++ };
    for (const event of events) {
      if (validatorWithKey.isAsync) {
        groupedValidators[event].async.push(validatorWithKey);
      } else {
        groupedValidators[event].sync.push(validatorWithKey);
      }
    }
  }

  return groupedValidators;
};

/**
 * Validate a given value with all validators for a given event
 * @param value Value to validate
 * @param event Event to validate
 * @param validatorMap Grouped validators
 * @param asyncValidationState AbortControllers for async validators
 * @param errorMap Signal to store errors
 * @param isValidating Signal to store whether the form is running async validation right now
 * @param accumulateErrors Whether to accumulate errors or stop on the first one
 */
export const validateWithValidators = async <TValue>(
  value: TValue,
  event: ValidatorEvents,
  validatorMap: Record<
    ValidatorEvents,
    {
      sync: Array<ValidatorSync<TValue> & WithKey>;
      async: Array<ValidatorAsync<TValue> & WithKey>;
    }
  >,
  asyncValidationState: Record<number, AbortController>,
  errorMap: Signal<Partial<Record<ValidatorEvents, ValidationError>>>,
  isValidating: Signal<boolean>,
  accumulateErrors?: boolean,
) => {
  // Get the relevant validators
  const validators = validatorMap[event];
  // Copy the current errors, so no error is lost
  const errors: Partial<Record<ValidatorEvents, ValidationError>> = {
    ...errorMap.peek(),
  };

  //region Sync validators
  for (const validator of validators.sync) {
    // Validate the value in order
    errors[event] = validator.validate(value);
    // If there is an error, and we don't want to accumulate errors, we stop the validation
    if (errors[event] && !accumulateErrors) {
      return batch(() => {
        isValidating.value = false;
        errorMap.value = errors;
      });
    }
  }
  //endregion

  //region Async validators
  // Create a new AbortController for this round of async validation
  const abortController = new AbortController();
  // If there are async validators, we are validating
  isValidating.value = !!validators.async.length;

  const asyncValidationPromises = validators.async.map(async (validator) => {
    // Abort the previous async validation for this validator and assign the new one
    asyncValidationState[validator.key]?.abort();
    asyncValidationState[validator.key] = abortController;

    /**
     * Validate the value with the async validator and assign the error to the error object
     */
    const validate = async () =>
      validator.validate(value, abortController.signal).then((error) => {
        errors[event] = error;
        // If we don't want to accumulate errors and there is an error, we abort the validation of other async validators this round
        if (errors[event] && !accumulateErrors) {
          abortController.abort();
        }
      });

    // If there is no debounce, we validate immediately
    if (!validator.debounceMs) {
      return validate();
    }

    return new Promise<string | undefined>((resolve) => {
      // Set the timeout for the debounced time (we do not need to clear the timeout, since we are using an AbortController)
      setTimeout(async () => {
        // If the validation was aborted before this debouncing, we resolve
        if (abortController.signal.aborted) {
          return resolve(undefined);
        }

        await validate();
        resolve(undefined);
      }, validator.debounceMs);
    });
  });

  // We only want to await anything if there are async validators
  if (asyncValidationPromises.length) {
    // If we want to accumulate errors, we await all async validators, if not, we await the first one
    if(accumulateErrors) {
      await Promise.all(asyncValidationPromises)
    } else {
      await Promise.race(asyncValidationPromises)
    }
  }
  //endregion

  // Assign the final errors
  batch(() => {
    isValidating.value = false;
    errorMap.value = errors;
  });
}

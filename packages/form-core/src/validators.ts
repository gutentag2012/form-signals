interface ValidatorBase {
	/**
	 * Whether the validator should run on change
	 * @default true
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

export interface ValidatorSync<TValue> extends ValidatorBase {
	isAsync?: false;
	validate: (
		value: TValue,
		abortSignal: AbortSignal,
	) => Array<string> | undefined;
}

export interface ValidatorAsync<TValue> extends ValidatorBase {
	isAsync: true;
	validate: (value: TValue) => Promise<Array<string> | undefined>;
	debounceMs?: number;
}

export type Validator<TValue> = ValidatorSync<TValue> | ValidatorAsync<TValue>;

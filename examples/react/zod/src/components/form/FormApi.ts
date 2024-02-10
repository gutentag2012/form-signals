type FormApiOptions = {};

export class FormApi<TData> {
	constructor(
		private readonly options: FormApiOptions,
		private readonly defaultData: TData,
	) {}
}

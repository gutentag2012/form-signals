import {
  deepSignalifyValue,
  getSignalValueAtPath, getValueAtPath,
  setSignalValueAtPath,
  SignalifiedData,
} from "@/components/form/signals.utils";
import {Paths, ValueAtPath} from "@/components/form/types.utils";
import {signal, Signal} from "@preact/signals-react";
import {FieldApi} from "@/components/form/FieldApi";

type FormApiOptions<TData> = {
	defaultValues?: TData;
};

// TODO In addition to the onSubmit validator this should also have a afterSubmit validation which checks all the transformed values
export class FormApi<TData> {
	private readonly _data: SignalifiedData<TData> | Signal<undefined>;
	// biome-ignore lint/suspicious/noExplicitAny: This could a field with any type of output
private  readonly _fields: Map<Paths<TData>, FieldApi<TData, Paths<TData>, any>>;

	constructor(private readonly _options?: FormApiOptions<TData>) {
		if (this._options?.defaultValues) {
			this._data = deepSignalifyValue(this._options.defaultValues);
		} else {
			this._data = signal(undefined);
		}
		this._fields = new Map();
	}

	public registerField<TPath extends Paths<TData>, TOutput>(
		path: TPath,
		field: FieldApi<TData, TPath, TOutput>,
		defaultValues?: ValueAtPath<TData, TPath>,
	) {
		this._fields.set(path, field);
    if(defaultValues === undefined) return;
		setSignalValueAtPath<TData, TPath>(this._data, path, defaultValues);
	}

	public unregisterField<TPath extends Paths<TData>>(path: TPath) {
		this._fields.delete(path);
		// TODO Remove from data
	}

	public getDefaultValueForPath<TPath extends Paths<TData>>(
		path: TPath,
	): ValueAtPath<TData, TPath> | undefined {
    if(!this._options?.defaultValues) return undefined;
		return getValueAtPath<TData, TPath>(this._options.defaultValues, path);
	}

	public getValueForPath<TPath extends Paths<TData>>(
		path: TPath,
	): SignalifiedData<ValueAtPath<TData, TPath>> {
		const value = getSignalValueAtPath<TData, TPath>(this._data, path);
		if (value) return value;

		const createdValue = setSignalValueAtPath<TData, TPath>(
			this._data,
			path,
			this.getDefaultValueForPath(path),
		);
		if (!createdValue) throw new Error("Could not create value for path");
		return createdValue;
	}

	get state() {
		return this._data as SignalifiedData<TData>;
	}
}

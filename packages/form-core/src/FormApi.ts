import {
  deepSignalifyValue,
  getSignalValueAtPath,
  getValueAtPath,
  removeSignalValueAtPath,
  setSignalValueAtPath,
  SignalifiedData,
} from "./signals.utils";
import {Paths, ValueAtPath} from "./types.utils";
import {signal, Signal} from "@preact/signals";
import {FieldApi} from "./FieldApi";

type FormApiOptions<TData> = {
	defaultValues?: TData;
};

export class FormApi<TData> {
  /**
   * Single source of truth for the form data
   * @private
   */
	private readonly _data: SignalifiedData<TData> | Signal<undefined>;
  /**
   * Map of all the fields in the form
   * @private
   */
	private readonly _fields: Map<
		Paths<TData>,
		FieldApi<TData, Paths<TData>>
	>;
  // TODO Add support for plugins

	constructor(private readonly _options?: FormApiOptions<TData>) {
		if (this._options?.defaultValues) {
			this._data = deepSignalifyValue(this._options.defaultValues);
		} else {
			this._data = signal(undefined);
		}
		this._fields = new Map();
	}

  public handleSubmit = async () => {
    for (const field of this._fields.values()) {
      await field.handleSubmit()
    }
  }

	public registerField<TPath extends Paths<TData>>(
		path: TPath,
		field: FieldApi<TData, TPath>,
		defaultValues?: ValueAtPath<TData, TPath>,
	) {
		this._fields.set(path, field);
		if (defaultValues === undefined) return;
		setSignalValueAtPath<TData, TPath>(this._data, path, defaultValues);
	}

	public unregisterField<TPath extends Paths<TData>>(path: TPath, preserveValue?: boolean) {
		this._fields.delete(path);
    if (preserveValue) return;
    removeSignalValueAtPath(this._data, path);
	}

	public getDefaultValueForPath<TPath extends Paths<TData>>(
		path: TPath,
	): ValueAtPath<TData, TPath> | undefined {
		return getValueAtPath<TData, TPath>(this._options?.defaultValues, path);
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

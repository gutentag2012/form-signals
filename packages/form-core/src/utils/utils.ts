export function Truthy<T>(
	value: T | boolean | null | undefined,
): value is NonNullable<T> {
	return !!value;
}

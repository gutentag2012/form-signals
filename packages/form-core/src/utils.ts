export const Truthy = <T>(value: T | boolean | null | undefined): value is NonNullable<T> => !!value;

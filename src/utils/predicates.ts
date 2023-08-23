export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function hasDuplicates<T>(values: Array<T>): boolean {
  return new Set(values).size !== values.length;
}

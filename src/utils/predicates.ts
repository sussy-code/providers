export function hasDuplicates<T>(values: Array<T>): boolean {
  return new Set(values).size !== values.length;
}

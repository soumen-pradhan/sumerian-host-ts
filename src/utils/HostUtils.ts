/** An empty Base class for mixins */
export class EmptyBase {}

/** Generate a unique id */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Check a name string against an array of strings to determine if it is unique.
 * If it isn't, append incremented trailing integers to the end of the name
 * until it is unique.
 */
export function getUniqueName(name: string, names: string[]): string {
  if (!names.includes(name)) {
    return name;
  }

  const uuid = crypto.randomUUID();
  return `${name}_${uuid}`;
}

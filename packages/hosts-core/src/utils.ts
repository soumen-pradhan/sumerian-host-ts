export function impl(msg?: string): never {
  throw new Error(msg ?? ' ' + 'Method to be impl');
}

export function throwErr(msg?: string): never {
  throw new Error(msg);
}

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
export function getUniqueName(name: string, nameArray: string[]): string {
  // If the name isn't in the array return it right away
  if (!nameArray.includes(name)) {
    return name;
  }

  const nameSet = new Set(nameArray);

  // Separate the name into string and trailing numbers
  const matchGroup = name.match(/\d*$/)!;
  const { index } = matchGroup;
  const baseName = name.slice(0, index);
  let increment = Number(matchGroup[0]);

  // Find the highest trailing number value for the base of the name
  nameSet.forEach((setName) => {
    const setMatchGroup = setName.match(/\d*$/)!;

    if (setName.slice(0, setMatchGroup.index) === baseName) {
      const setIncrement = Number(setMatchGroup[0]);

      if (setIncrement > increment) {
        increment = setIncrement;
      }
    }
  });

  // Increment the highest trailing number and append to the name
  return `${baseName}${increment + 1}`;
}

import * as TWEEN from '@tweenjs/tween.js';
import Deferred from './Deferred';

export function impl(msg?: string): never {
  throw new Error(msg ?? ' ' + 'Method to be impl');
}

export function throwErr(msg?: string): never {
  throw new Error(msg);
}

/** An empty Base class for mixins */
export class EmptyBase {}

const Utils = {
  /** Generate a unique id */
  uuid(): string {
    return crypto.randomUUID();
  },

  /**
   * Check a name string against an array of strings to determine if it is unique.
   * If it isn't, append incremented trailing integers to the end of the name
   * until it is unique.
   */
  getUniqueName(name: string, nameArray: string[]): string {
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
  },

  /**
   * Get a random float between a min (inclusive) and max (exclusive) value
   */
  getRandomFLoat(min: number, max: number) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Get a random integer between a min (inclusive) and max (exclusive) value
   */
  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.ceil(max);

    return Math.floor(Math.random() * (max - min) + min);
  },

  /**
   * Return a deferred promise that will wait a given number of seconds before
   * resolving. Pass delta time in milliseconds to the deferred promise's execute
   * method in an update loop to progress time.
   */
  wait<T>(
    ms = 0,
    on: {
      onFinish?: () => unknown;
      onProgress?: (percent: number) => unknown;
      onCancel?: () => unknown;
      onError?: (reason?: unknown) => unknown;
    } = {}
  ): Deferred<T | undefined> {
    // Resolve immediately if the wait time is not greater than 0
    if (ms <= 0) {
      on.onFinish?.();
      return Deferred.resolved();
    }

    let currentTimeMs = 0;
    const totalTimeMs = ms;

    // Executable to pass to Deferred, meant to be run in an update loop
    const onUpdate: ConstructorParameters<typeof Deferred<void>>[0] = (
      resolve,
      reject,
      _cancel,
      deltaTimeMs = 0
    ) => {
      if (typeof deltaTimeMs !== 'number') {
        const e = new Error(
          `Invalid property wait deltaTime. DeltaTime must be a number.`
        );
        reject?.(e);
        return;
      }

      // Make sure time has passed
      if (deltaTimeMs === 0) {
        return;
      }

      // Signal progress
      currentTimeMs += deltaTimeMs;
      if (currentTimeMs < 0) {
        currentTimeMs = 0;
      }

      on.onProgress?.(Math.min(currentTimeMs / totalTimeMs, 1));

      // Signal completion once time is up
      if (currentTimeMs >= totalTimeMs) {
        resolve?.();
      }
    };

    // @ts-expect-error Type shenanigans
    return new Deferred(onUpdate, {
      onResolve: on.onFinish,
      onReject: on.onError,
      onCancel: on.onCancel,
    });
  },

  Math: {
    Rad2Deg: 180 / Math.PI,
    Deg2Rad: Math.PI / 180,

    toDeg(rad: number) {
      return rad * this.Rad2Deg;
    },

    toRad(deg: number) {
      return deg * this.Deg2Rad;
    },

    /**
     * Linearly interpolate between two values
     * @param factor 0..1 amount to interpolate - maps to from..to
     */
    lerp(from: number, to: number, factor: number) {
      return from + (to - from) * factor;
    },

    /**
     * Clamp a number between 2 values.
     */
    clamp(value: number, min = 0, max = 1): number {
      return Math.max(min, Math.min(value, max));
    },
  },

  Anim: {
    /**
     * Return a deferred promise that can be used to update the value of a numeric
     * property of this object over time. Pass delta time in milliseconds to the
     * deferred promise's execute method in an update loop to animate the property
     * towards the target value.
     * @param owner Object that contains the property to animation
     * @param prop Name of the property to animate
     * @param targetValue Target value to reach
     * @returns Resolves when the property value reaches the target value
     */
    interpolate<T extends object, TProp extends keyof T>(
      owner: T,
      prop: TProp,
      targetValue: number,
      opts: {
        ms?: number;
        easingFn?: EasingFn;
        onFinish?: (propValue: number) => void;
        onProgress?: (propValue: number) => void;
        onCancel?: (propValue: number) => void;
        onError?: (reason: unknown) => void;
      } = {}
    ): Deferred<number> {
      // Make sure owner is an object
      if (!(owner instanceof Object)) {
        const err = new Error('Property owner must be an object.');
        opts.onError?.(err);
        return Deferred.rejected(err);
      }

      // Make sure property is numeric
      if (Number.isNaN(+owner[prop]) || Number.isNaN(+targetValue)) {
        const err = new Error(
          `Property ${prop.toString()} and targetValue are not numeric value`
        );
        opts.onError?.(err);
        return Deferred.rejected(err);
      }

      // Resolve immediately if the target has already been reached
      const startValue = owner[prop] as number;

      if (startValue === targetValue) {
        opts.onFinish?.(targetValue);
        return Deferred.resolved(targetValue);
      }

      // Default to lerp
      let easingFn = opts.easingFn;
      if (easingFn === undefined) {
        console.warn('Invalid interpolation easing. Defaulting to lerp.');
        easingFn = TWEEN.Easing.Linear.None;
      }

      const ms = opts.ms ?? 0;

      const interpolator = Utils.wait<number>(ms, {
        onFinish: () => {
          owner[prop] = targetValue as T[TProp];
          opts.onFinish?.(owner[prop] as number);
        },
        onCancel: () => opts.onCancel?.(owner[prop] as number),
        onProgress: (percent: number) => {
          // Update the property
          if ((owner[prop] as number) !== targetValue) {
            const easeFactor = easingFn(percent);
            owner[prop] = Utils.Math.lerp(
              startValue,
              targetValue as number,
              easeFactor
            ) as T[TProp];
          }

          // Signal progress
          opts.onProgress?.(owner[prop] as number);

          // Signal completion once time is up
          if (percent === 1) {
            owner[prop] = targetValue as T[TProp];
            interpolator.resolve(targetValue);
          }
        },
      });

      return interpolator as Deferred<number>;
    },
  },
};

export default Utils;

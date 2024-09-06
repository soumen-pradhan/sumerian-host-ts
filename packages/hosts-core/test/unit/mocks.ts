import { vi } from 'vitest';
import { AbstractHostFeature, HostObject } from '../../src';

export class MockFeature extends AbstractHostFeature<{ id: string }> {
  name = 'MockFeature';
}

export class MockHost extends HostObject<{ id: string }> {
  constructor(opts: { owner: { id: string } }) {
    super(opts);
  }

  override emit<R>(_msg: HostEvent<string, R>, _value: R): void {}

  override listenTo<R>(
    _msg: HostEvent<string, R>,
    _callback: (evt: CustomEvent<R>) => unknown
  ): void {}

  override stopListening<R>(
    _msg: HostEvent<string, R>,
    _callback: (evt: CustomEvent<R>) => unknown
  ): void {}
}

const Ref = {
  isGetter<T = object>(x: T, name: string): boolean {
    return Object.getOwnPropertyDescriptor(x, name)?.get !== undefined;
  },

  isFunction<T = object>(x: T, name: string): boolean {
    // @ts-expect-error Js code
    return typeof x[name] === 'function';
  },

  deepFn<T = object>(x: T): string[] {
    if (!x || x === Object.prototype) {
      return [];
    }

    return Object.getOwnPropertyNames(x)
      .filter((name) => this.isGetter(x, name) || this.isFunction(x, name))
      .concat(this.deepFn(Object.getPrototypeOf(x)));
  },

  distinctDeepFn<T = object>(x: T): string[] {
    return Array.from(new Set(this.deepFn(x)));
  },

  userFn<T = object>(x: T): string[] {
    return this.distinctDeepFn(x).filter((fn) => fn !== 'constructor');
  },
};

// const isGetter = (x, name) =>
//   (Object.getOwnPropertyDescriptor(x, name) || {}).get;
// const isFunction = (x, name) => typeof x[name] === 'function';
// const deepFunctions = <T>(x: T) =>
//   x &&
//   x !== Object.prototype &&
//   Object.getOwnPropertyNames(x)
//     .filter((name) => isGetter(x, name) || isFunction(x, name))
//     .concat(deepFunctions(Object.getPrototypeOf(x)) || []);
// const distinctDeepFunctions = (x) => Array.from(new Set(deepFunctions(x)));
// const userFunctions = (x) =>
//   distinctDeepFunctions(x).filter(
//     (name) => name !== 'constructor' && !~name.indexOf('__')
//   );

/**
 * Decorator that wraps all methods of an object with {@link vi.spyOn}.
 *
 * @param target - The object whose methods will be spied on.
 * @returns The object with all methods spied on.
 */
export function spyOnAllMethods<T extends object>(target: T): T {
  for (const pubFn of Ref.userFn(target)) {
    // @ts-expect-error Dynamic part of js
    if (typeof target[pubFn] === 'function') {
      // @ts-expect-error Dynamic part of js
      vi.spyOn(target, pubFn);
    }
  }

  return target;
}

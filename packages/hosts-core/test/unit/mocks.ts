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

/**
 * Decorator that wraps all methods of an object with {@link vi.spyOn}.
 *
 * @param target - The object whose methods will be spied on.
 * @returns A new object with all methods spied on.
 */
export function spyOnAllMethods<T extends object>(target: T): T {
  const spiedObject = { ...target };

  for (const key of Object.keys(spiedObject)) {
    // @ts-expect-error Dynamic part of js
    if (typeof spiedObject[key] === 'function') {
      // @ts-expect-error Dynamic part of js
      vi.spyOn(spiedObject, key);
    }
  }

  return spiedObject;
}

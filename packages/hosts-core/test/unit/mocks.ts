import { HostObject } from '../../src';
import AbstractHostFeature from '../../src/AbstractHostFeature';

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
